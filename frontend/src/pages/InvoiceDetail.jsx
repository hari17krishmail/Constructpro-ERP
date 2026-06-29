import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import StatusBadge from '../components/StatusBadge';
import { useToast } from '../components/Toast';
import ConfirmModal from '../components/ConfirmModal';

const fmt = (n) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n || 0);

const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString('en-US', { dateStyle: 'medium' }) : '—';

const PM_EDITABLE_STATUSES = ['PENDING_APPROVAL', 'REJECTED'];

const getAccountantActions = (status) => {
  if (status === 'DRAFT')     return [
    { key: 'submit',  label: 'Submit for Approval', variant: 'primary' },
    { key: 'edit',    label: 'Edit',                variant: 'secondary' },
    { key: 'delete',  label: 'Delete',              variant: 'danger' },
  ];
  if (status === 'APPROVED')  return [{ key: 'send',    label: 'Mark as Sent', variant: 'primary' }];
  if (status === 'SENT')      return [{ key: 'pay',     label: 'Mark as Paid', variant: 'success' }];
  if (status === 'REJECTED')  return [{ key: 'redraft', label: 'Back to Draft', variant: 'secondary' }];
  return [];
};

const InvoiceDetail = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  const [invoice, setInvoice]           = useState(null);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState('');
  const [actionLoading, setActionLoading] = useState('');
  const [deleteModal, setDeleteModal]   = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // PM edit-status modal state
  const [pmModal, setPmModal]       = useState(false);
  const [pmStatus, setPmStatus]     = useState('PENDING_APPROVAL');
  const [rejectNote, setRejectNote] = useState('');
  const [pmLoading, setPmLoading]   = useState(false);
  const [pmError, setPmError]       = useState('');

  useEffect(() => {
    setLoading(true);
    api.get(`/invoices/${id}`)
      .then(({ data }) => setInvoice(data))
      .catch(() => setError('Invoice not found or access denied'))
      .finally(() => setLoading(false));
  }, [id]);

  // ── Accountant actions ────────────────────────────────────
  const ACTION_TOASTS = {
    submit:  'Invoice submitted for approval!',
    send:    'Invoice marked as Sent!',
    pay:     'Invoice marked as Paid!',
    redraft: 'Invoice moved back to Draft!',
  };

  const doAction = async (key) => {
    setError('');
    if (key === 'edit') { navigate(`/invoices/${id}/edit`); return; }
    if (key === 'delete') { setDeleteModal(true); return; }
    setActionLoading(key);
    try {
      const endpoint = { submit: 'submit', send: 'send', pay: 'pay', redraft: 'redraft' }[key];
      const { data } = await api.post(`/invoices/${id}/${endpoint}`);
      setInvoice(data);
      toast(ACTION_TOASTS[key]);
    } catch (err) {
      setError(err.response?.data?.message || 'Action failed');
    } finally {
      setActionLoading('');
    }
  };

  const confirmDelete = async () => {
    setDeleteLoading(true);
    try {
      await api.delete(`/invoices/${id}`);
      toast('Invoice deleted successfully!');
      navigate('/invoices');
    } catch (err) {
      setError(err.response?.data?.message || 'Delete failed');
      setDeleteLoading(false);
      setDeleteModal(false);
    }
  };

  // ── PM modal helpers ──────────────────────────────────────
  const openPmModal = () => {
    const current = PM_EDITABLE_STATUSES.includes(invoice.status)
      ? invoice.status
      : 'PENDING_APPROVAL';
    setPmStatus(current);
    setRejectNote(invoice.status === 'REJECTED' ? (invoice.rejectionNote || '') : '');
    setPmError('');
    setPmModal(true);
  };

  const closePmModal = () => {
    setPmModal(false);
    setPmStatus('PENDING_APPROVAL');
    setRejectNote('');
    setPmError('');
    setPmLoading(false);
  };

  const handleSavePmStatus = async () => {
    if (pmStatus === 'REJECTED' && !rejectNote.trim()) return;
    setPmLoading(true);
    setPmError('');
    try {
      const payload = { status: pmStatus };
      if (pmStatus === 'REJECTED') payload.note = rejectNote.trim();
      const { data } = await api.put(`/invoices/${id}/status`, payload);
      setInvoice(data);
      closePmModal();
      toast('Invoice status updated successfully!');
    } catch (err) {
      setPmError(err.response?.data?.message || 'Failed to update status');
      setPmLoading(false);
    }
  };

  // ── PDF export ────────────────────────────────────────────
  const exportPDF = () => {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const pageW = doc.internal.pageSize.getWidth();
    const pageH = doc.internal.pageSize.getHeight();
    const margin = 14;
    const rightX = pageW - margin;
    const halfW  = (pageW - margin * 2) / 2;

    // ── Company header (left) + Invoice number (right) ──────
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(168, 136, 42);
    doc.text('ConstructPro ERP', margin, 20);

    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(130, 130, 130);
    doc.text('Invoicing & Billing ERP', margin, 26);

    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 30, 30);
    doc.text(invoice.invoiceNumber, rightX, 20, { align: 'right' });

    const STATUS_COLORS = {
      DRAFT:            [107, 114, 128],
      PENDING_APPROVAL: [161, 98, 7],
      APPROVED:         [21, 128, 61],
      SENT:             [29, 78, 216],
      PAID:             [6, 95, 70],
      REJECTED:         [185, 28, 28],
    };
    const [sr, sg, sb] = STATUS_COLORS[invoice.status] || [80, 80, 80];
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(sr, sg, sb);
    doc.text(invoice.status.replace(/_/g, ' '), rightX, 28, { align: 'right' });

    // Divider
    doc.setDrawColor(220, 220, 220);
    doc.setLineWidth(0.4);
    doc.line(margin, 33, rightX, 33);

    // ── Info grid ────────────────────────────────────────────
    const label = (text, x, y) => {
      doc.setFontSize(7.5);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(130, 130, 130);
      doc.text(text, x, y);
    };
    const value = (text, x, y) => {
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(30, 30, 30);
      doc.text(text, x, y);
    };

    let y = 42;
    const col1 = margin;
    const col2 = margin + halfW;

    // Project | Client
    label('PROJECT', col1, y);
    label('CLIENT', col2, y);
    value(invoice.projectId?.name ?? '—', col1, y + 5);
    const clientName = invoice.client?.name ?? '—';
    const clientSub  = invoice.client?.clientId
      ? `  #${String(invoice.client.clientId).padStart(3, '0')}`
      : '';
    value(clientName + clientSub, col2, y + 5);
    y += 16;

    // Issue Date | Due Date
    label('ISSUE DATE', col1, y);
    label('DUE DATE', col2, y);
    value(fmtDate(invoice.issueDate), col1, y + 5);
    value(fmtDate(invoice.dueDate), col2, y + 5);
    y += 16;

    // Created by | Approved by
    label('CREATED BY', col1, y);
    if (invoice.approvedBy) label('APPROVED BY', col2, y);
    value(
      invoice.createdBy?.name
        ? `${invoice.createdBy.name} (${invoice.createdBy.role ?? ''})`
        : '—',
      col1, y + 5
    );
    if (invoice.approvedBy) value(invoice.approvedBy.name, col2, y + 5);
    y += 16;

    // Rejection note box
    if (invoice.status === 'REJECTED' && invoice.rejectionNote) {
      doc.setFillColor(254, 242, 242);
      doc.setDrawColor(252, 165, 165);
      doc.roundedRect(margin, y, pageW - margin * 2, 14, 2, 2, 'FD');

      doc.setFontSize(7.5);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(185, 28, 28);
      doc.text('REJECTION REASON', margin + 4, y + 5);

      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(120, 20, 20);
      const noteLines = doc.splitTextToSize(invoice.rejectionNote, pageW - margin * 2 - 8);
      doc.text(noteLines[0], margin + 4, y + 11);
      y += 20;
    }

    // Section divider
    doc.setDrawColor(220, 220, 220);
    doc.line(margin, y, rightX, y);
    y += 8;

    // Section heading
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 30, 30);
    doc.text('LINE ITEMS', margin, y);
    y += 5;

    // ── Line items table ─────────────────────────────────────
    autoTable(doc, {
      startY: y,
      head: [['Description', 'Category', 'Qty', 'Unit Price', 'Line Total']],
      body: invoice.lineItems.map((item) => [
        item.description,
        item.category,
        String(item.quantity),
        fmt(item.unitPrice),
        fmt(item.lineTotal),
      ]),
      styles: { fontSize: 9, cellPadding: 4 },
      headStyles: { fillColor: [201, 168, 76], textColor: 255, fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      columnStyles: {
        2: { halign: 'right' },
        3: { halign: 'right' },
        4: { halign: 'right', fontStyle: 'bold' },
      },
      margin: { left: margin, right: margin },
    });

    // ── Totals block ─────────────────────────────────────────
    const endY = doc.lastAutoTable.finalY + 10;
    const labelX = rightX - 40;

    doc.setFontSize(9.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(80, 80, 80);
    doc.text('Subtotal', labelX, endY);
    doc.text(fmt(invoice.subtotal), rightX, endY, { align: 'right' });

    doc.text(`Tax (${invoice.taxRate}%)`, labelX, endY + 7);
    doc.text(fmt(invoice.taxAmount), rightX, endY + 7, { align: 'right' });

    doc.setDrawColor(200, 200, 200);
    doc.line(labelX - 2, endY + 10, rightX, endY + 10);

    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(168, 136, 42);
    doc.text('Total', labelX, endY + 17);
    doc.text(fmt(invoice.total), rightX, endY + 17, { align: 'right' });

    // ── Footer ───────────────────────────────────────────────
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(170);
    doc.text(
      `Generated ${new Date().toLocaleDateString('en-US', { dateStyle: 'long' })} · ConstructPro ERP`,
      pageW / 2,
      pageH - 10,
      { align: 'center' }
    );

    doc.save(`${invoice.invoiceNumber}.pdf`);
  };

  // ── Render guards ─────────────────────────────────────────
  if (loading) return <div className="page-center">Loading…</div>;
  if (error && !invoice) return <div className="page-center error-msg">{error}</div>;
  if (!invoice) return null;

  const userRole        = user?.role;
  const isAccountant    = userRole === 'ACCOUNTANT';
  const isPM            = userRole === 'PROJECT_MANAGER';
  const showPmEdit      = isPM && PM_EDITABLE_STATUSES.includes(invoice.status);
  const acctActions     = isAccountant ? getAccountantActions(invoice.status) : [];
  const project         = invoice.projectId;

  return (
    <div className="page">
      {/* ── Page Header ───────────────────────────────────── */}
      <div className="page-header">
        <div>
          <button className="btn btn-ghost btn-sm" onClick={() => navigate('/invoices')}>
            ← Invoices
          </button>
          <h2 style={{ margin: '8px 0 4px' }}>{invoice.invoiceNumber}</h2>
          <StatusBadge status={invoice.status} />
        </div>

        <div className="action-bar">
          {/* Accountant workflow actions */}
          {acctActions.map((a) => (
            <button
              key={a.key}
              className={`btn btn-${a.variant}`}
              onClick={() => doAction(a.key)}
              disabled={Boolean(actionLoading)}
            >
              {actionLoading === a.key ? '…' : a.label}
            </button>
          ))}

          {/* PM: Edit status button */}
          {showPmEdit && (
            <button className="btn btn-primary" onClick={openPmModal}>
              Edit
            </button>
          )}

          <button className="btn btn-secondary" onClick={exportPDF}>
            Export PDF
          </button>
        </div>
      </div>

      {error && <p className="error-msg">{error}</p>}

      {invoice.status === 'REJECTED' && invoice.rejectionNote && (
        <div className="alert alert-danger">
          <strong>Rejection reason:</strong> {invoice.rejectionNote}
        </div>
      )}

      {/* ── Detail cards ──────────────────────────────────── */}
      <div className="detail-grid">
        <div className="detail-card">
          <h4>Project</h4>
          <p className="detail-value">{project?.name ?? '—'}</p>
        </div>
        <div className="detail-card">
          <h4>Client</h4>
          <p className="detail-value">{invoice.client?.name ?? '—'}</p>
          {invoice.client?.clientId && (
            <p className="detail-sub">#{String(invoice.client.clientId).padStart(3, '0')}</p>
          )}
        </div>
        <div className="detail-card">
          <h4>Issue Date</h4>
          <p className="detail-value">{fmtDate(invoice.issueDate)}</p>
        </div>
        <div className="detail-card">
          <h4>Due Date</h4>
          <p className="detail-value">{fmtDate(invoice.dueDate)}</p>
        </div>
        <div className="detail-card">
          <h4>Created by</h4>
          <p className="detail-value">{invoice.createdBy?.name ?? '—'}</p>
          <p className="detail-sub">{invoice.createdBy?.role}</p>
        </div>
        {invoice.approvedBy && (
          <div className="detail-card">
            <h4>Approved by</h4>
            <p className="detail-value">{invoice.approvedBy.name}</p>
          </div>
        )}
      </div>

      {/* ── Line items ────────────────────────────────────── */}
      <h3 style={{ margin: '24px 0 12px' }}>Line Items</h3>
      <div className="table-wrapper">
        <table className="table">
          <thead>
            <tr>
              <th>Description</th>
              <th>Category</th>
              <th style={{ textAlign: 'right' }}>Qty</th>
              <th style={{ textAlign: 'right' }}>Unit Price</th>
              <th style={{ textAlign: 'right' }}>Line Total</th>
            </tr>
          </thead>
          <tbody>
            {invoice.lineItems.map((item) => (
              <tr key={item._id}>
                <td>{item.description}</td>
                <td><span className="category-tag">{item.category}</span></td>
                <td style={{ textAlign: 'right' }}>{item.quantity}</td>
                <td style={{ textAlign: 'right' }}>{fmt(item.unitPrice)}</td>
                <td style={{ textAlign: 'right', fontWeight: 600 }}>{fmt(item.lineTotal)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ── Totals ───────────────────────────────────────── */}
      <div className="totals-box">
        <div className="totals-row">
          <span>Subtotal</span>
          <span>{fmt(invoice.subtotal)}</span>
        </div>
        <div className="totals-row">
          <span>Tax ({invoice.taxRate}%)</span>
          <span>{fmt(invoice.taxAmount)}</span>
        </div>
        <div className="totals-row totals-total">
          <span>Total</span>
          <span>{fmt(invoice.total)}</span>
        </div>
      </div>

      {/* ── Delete Confirmation Modal ─────────────────────── */}
      {deleteModal && (
        <ConfirmModal
          title="Delete Invoice"
          message={`Are you sure you want to delete invoice ${invoice.invoiceNumber}? This cannot be undone.`}
          onConfirm={confirmDelete}
          onCancel={() => setDeleteModal(false)}
          loading={deleteLoading}
        />
      )}

      {/* ── PM Edit Status Modal ──────────────────────────── */}
      {pmModal && (
        <div className="modal-backdrop" onClick={closePmModal}>
          <div className="modal" style={{ maxWidth: 420 }} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ margin: '0 0 6px' }}>Edit Invoice</h3>
            <p style={{ margin: '0 0 20px', fontSize: 13, color: 'var(--text-muted)' }}>
              <strong style={{ color: 'var(--text)' }}>{invoice.invoiceNumber}</strong>
              {project?.name ? ` · ${project.name}` : ''}
            </p>

            {pmError && <p className="error-msg" style={{ marginBottom: 12 }}>{pmError}</p>}

            <div className="form-group">
              <label>Status</label>
              <select
                value={pmStatus}
                onChange={(e) => {
                  setPmStatus(e.target.value);
                  setRejectNote('');
                  setPmError('');
                }}
                disabled={pmLoading}
              >
                <option value="PENDING_APPROVAL">Pending Approval</option>
                <option value="REJECTED">Rejected</option>
              </select>
            </div>

            {pmStatus === 'REJECTED' && (
              <div className="form-group">
                <label>Rejection Reason *</label>
                <textarea
                  rows={3}
                  value={rejectNote}
                  onChange={(e) => setRejectNote(e.target.value)}
                  placeholder="Enter reason for rejection…"
                  className="textarea"
                  disabled={pmLoading}
                />
              </div>
            )}

            <div className="form-actions" style={{ marginTop: 20 }}>
              <button
                className="btn btn-primary"
                onClick={handleSavePmStatus}
                disabled={pmLoading || (pmStatus === 'REJECTED' && !rejectNote.trim())}
              >
                {pmLoading ? 'Saving…' : 'Save'}
              </button>
              <button className="btn btn-ghost" onClick={closePmModal} disabled={pmLoading}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InvoiceDetail;
