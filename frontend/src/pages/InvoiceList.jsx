import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import StatusBadge from '../components/StatusBadge';
import { useToast } from '../components/Toast';
import Pagination from '../components/Pagination';

const ALL_STATUSES = [
  // 'DRAFT', 
  'PENDING_APPROVAL', 
  'APPROVED', 
  // 'SENT', 
  'PAID', 
  'REJECTED'
];

const fmt = (n) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);

const fmtDate = (d) => new Date(d).toLocaleDateString('en-US', { dateStyle: 'medium' });

const InvoiceList = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  const [invoices, setInvoices]           = useState([]);
  const [projects, setProjects]           = useState([]);
  const [loading, setLoading]             = useState(true);
  const [error, setError]                 = useState('');
  const [filterProject, setFilterProject] = useState('');
  const [filterStatus,  setFilterStatus]  = useState('');
  const [page, setPage]                   = useState(1);
  const PAGE_SIZE = 10;

  // PM edit-status modal
  const [editModal, setEditModal]       = useState(null);
  const [editStatus, setEditStatus]     = useState('');
  const [rejectNote, setRejectNote]     = useState('');
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError]     = useState('');

  // Client Viewer pay confirmation modal
  const [payModal, setPayModal]     = useState(null);
  const [payLoading, setPayLoading] = useState(false);
  const [payError, setPayError]     = useState('');

  const isAccountant   = user?.role === 'ACCOUNTANT';
  const isPM           = user?.role === 'PROJECT_MANAGER';
  const isClient       = user?.role === 'CLIENT_VIEWER';
  const canSeeProjects = ['ADMIN', 'ACCOUNTANT', 'PROJECT_MANAGER'].includes(user?.role);

  useEffect(() => {
    api.get('/invoices')
      .then(({ data }) => setInvoices(data))
      .catch(() => setError('Failed to load invoices'))
      .finally(() => setLoading(false));

    if (canSeeProjects) {
      api.get('/projects')
        .then(({ data }) => setProjects(data))
        .catch(() => {});
    }
  }, []);

  const applyFilter = async (project = filterProject, status = filterStatus) => {
    setLoading(true);
    setPage(1);
    const params = {};
    if (project) params.projectId = project;
    if (status)  params.status    = status;
    try {
      const { data } = await api.get('/invoices', { params });
      setInvoices(data);
    } catch {
      setError('Failed to load invoices');
    } finally {
      setLoading(false);
    }
  };

  const clearFilter = () => {
    setFilterProject('');
    setFilterStatus('');
    applyFilter('', '');
  };

  // ── PDF export ───────────────────────────────────────────
  const exportPDF = () => {
    const doc = new jsPDF({ orientation: 'landscape' });

    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(168, 136, 42);
    doc.text('ConstructPro ERP — Invoice List', 14, 18);

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 100, 100);
    doc.text(
      `Generated: ${new Date().toLocaleDateString('en-US', { dateStyle: 'long' })}`,
      14, 26
    );

    const filterParts = [];
    if (filterProject) {
      const proj = projects.find((p) => p._id === filterProject);
      if (proj) filterParts.push(`Project: ${proj.name}`);
    }
    if (filterStatus) filterParts.push(`Status: ${filterStatus.replace(/_/g, ' ')}`);

    let startY = 32;
    if (filterParts.length > 0) {
      doc.text(`Filters applied — ${filterParts.join(' | ')}`, 14, 32);
      startY = 38;
    }

    autoTable(doc, {
      startY,
      head: [['Invoice #', 'Project', 'Client', 'Status', 'Issue Date', 'Due Date', 'Total']],
      body: invoices.map((inv) => [
        inv.invoiceNumber,
        inv.projectId?.name ?? '—',
        inv.client?.name ?? '—',
        inv.status.replace(/_/g, ' '),
        fmtDate(inv.issueDate),
        fmtDate(inv.dueDate),
        fmt(inv.total),
      ]),
      styles: { fontSize: 9, cellPadding: 4 },
      headStyles: { fillColor: [201, 168, 76], textColor: 255, fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      columnStyles: { 6: { halign: 'right', fontStyle: 'bold' } },
      margin: { left: 14, right: 14 },
    });

    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(150);
      doc.text(
        `Page ${i} of ${pageCount}`,
        doc.internal.pageSize.getWidth() / 2,
        doc.internal.pageSize.getHeight() - 8,
        { align: 'center' }
      );
    }

    doc.save('invoice-list.pdf');
  };

  // ── PM edit helpers ─────────────────────────────────────
  const openEdit = (e, inv) => {
    e.stopPropagation();
    const pmStatuses = ['PENDING_APPROVAL', 'REJECTED'];
    setEditModal(inv);
    setEditStatus(pmStatuses.includes(inv.status) ? inv.status : 'PENDING_APPROVAL');
    setRejectNote(inv.status === 'REJECTED' ? (inv.rejectionNote || '') : '');
    setModalError('');
  };

  const closeEdit = () => {
    setEditModal(null);
    setEditStatus('');
    setRejectNote('');
    setModalError('');
  };

  const handleSaveStatus = async () => {
    if (editStatus === 'REJECTED' && !rejectNote.trim()) return;
    setModalLoading(true);
    setModalError('');
    try {
      const payload = { status: editStatus };
      if (editStatus === 'REJECTED') payload.note = rejectNote;
      const { data } = await api.put(`/invoices/${editModal._id}/status`, payload);
      setInvoices((prev) => prev.map((i) => (i._id === data._id ? data : i)));
      closeEdit();
      toast('Invoice status updated successfully!');
    } catch (err) {
      setModalError(err.response?.data?.message || 'Failed to update status');
      setModalLoading(false);
    }
  };

  // ── Client Viewer pay helpers ────────────────────────────
  const openPayModal = (e, inv) => {
    e.stopPropagation();
    setPayModal(inv);
    setPayError('');
  };

  const closePayModal = () => {
    setPayModal(null);
    setPayLoading(false);
    setPayError('');
  };

  const handleClientPay = async () => {
    setPayLoading(true);
    setPayError('');
    try {
      await api.post(`/invoices/${payModal._id}/client-pay`);
      // Remove from list — CLIENT_VIEWER only sees APPROVED, paid invoice leaves scope
      setInvoices((prev) => prev.filter((i) => i._id !== payModal._id));
      closePayModal();
      toast('Invoice marked as Paid successfully!');
    } catch (err) {
      setPayError(err.response?.data?.message || 'Failed to mark as paid');
      setPayLoading(false);
    }
  };

  const pendingCount = isPM ? invoices.filter((i) => i.status === 'PENDING_APPROVAL').length : 0;

  const totalPages = Math.ceil(invoices.length / PAGE_SIZE);
  const paginatedInvoices = invoices.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  if (loading) return <div className="page-center">Loading invoices…</div>;

  return (
    <div className="page">
      {/* ── Page Header ─────────────────────────────────── */}
      <div className="page-header">
        <div>
          <h2>Invoices</h2>
          {isPM && pendingCount > 0 && (
            <p style={{ margin: '4px 0 0', fontSize: 13, color: '#856404' }}>
              {pendingCount} invoice{pendingCount > 1 ? 's' : ''} awaiting your approval
            </p>
          )}
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {invoices.length > 0 && (
            <button className="btn btn-secondary" onClick={exportPDF}>
              Export PDF
            </button>
          )}
          {isAccountant && (
            <button className="btn btn-primary" onClick={() => navigate('/invoices/new')}>
              + New Invoice
            </button>
          )}
        </div>
      </div>

      {error && <p className="error-msg">{error}</p>}

      {/* ── Filters ──────────────────────────────────────── */}
      <div className="filter-bar">
        {canSeeProjects && (
          <select value={filterProject} onChange={(e) => setFilterProject(e.target.value)}>
            <option value="">All projects</option>
            {projects.map((p) => (
              <option key={p._id} value={p._id}>{p.name}</option>
            ))}
          </select>
        )}

        {/* Client Viewer: only Approved / Paid */}
        {isClient ? (
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
            <option value="">All statuses</option>
            <option value="APPROVED">Approved</option>
            <option value="PAID">Paid</option>
          </select>
        ) : (
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
            <option value="">All statuses</option>
            {ALL_STATUSES.map((s) => (
              <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>
            ))}
          </select>
        )}

        <button className="btn btn-secondary" onClick={() => applyFilter()}>Apply</button>
        <button className="btn btn-ghost" onClick={clearFilter}>Clear</button>
      </div>

      {/* ── Invoice Table ────────────────────────────────── */}
      {invoices.length === 0 ? (
        <div className="empty-state">No invoices found.</div>
      ) : (
        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>Invoice #</th>
                <th>Project</th>
                <th>Client</th>
                <th>Status</th>
                <th>Issue Date</th>
                <th>Due Date</th>
                <th style={{ textAlign: 'right' }}>Total</th>
                {(isPM || isClient) && <th style={{ width: 120 }}>Action</th>}
              </tr>
            </thead>
            <tbody>
              {paginatedInvoices.map((inv) => {
                const isPending = inv.status === 'PENDING_APPROVAL';
                return (
                  <tr
                    key={inv._id}
                    className="table-row-link"
                    style={isPM && isPending ? { background: '#fffbeb' } : undefined}
                    onClick={() => navigate(`/invoices/${inv._id}`)}
                  >
                    <td><span className="invoice-number">{inv.invoiceNumber}</span></td>
                    <td>{inv.projectId?.name ?? '—'}</td>
                    <td>{inv.client?.name ?? <span style={{ color: 'var(--text-muted)' }}>—</span>}</td>
                    <td><StatusBadge status={inv.status} /></td>
                    <td>{fmtDate(inv.issueDate)}</td>
                    <td>{fmtDate(inv.dueDate)}</td>
                    <td style={{ textAlign: 'right', fontWeight: 600 }}>{fmt(inv.total)}</td>

                    {/* PM: Edit status — only on PENDING_APPROVAL and REJECTED */}
                    {isPM && (
                      <td onClick={(e) => e.stopPropagation()}>
                        {(inv.status === 'PENDING_APPROVAL' || inv.status === 'REJECTED') && (
                          <button
                            className={`btn btn-sm ${isPending ? 'btn-primary' : 'btn-secondary'}`}
                            onClick={(e) => openEdit(e, inv)}
                          >
                            Edit
                          </button>
                        )}
                      </td>
                    )}

                    {/* Client Viewer: Mark as Paid (only on APPROVED rows) */}
                    {isClient && (
                      <td onClick={(e) => e.stopPropagation()}>
                        {inv.status === 'APPROVED' && (
                          <button
                            className="btn btn-sm btn-primary"
                            onClick={(e) => openPayModal(e, inv)}
                          >
                            Edit
                          </button>
                        )}
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
          <Pagination
            page={page}
            totalPages={totalPages}
            onPageChange={setPage}
            totalItems={invoices.length}
            pageSize={PAGE_SIZE}
          />
        </div>
      )}

      {/* PM Edit Status Modal */}
      {editModal && (
        <div className="modal-backdrop" onClick={closeEdit}>
          <div className="modal" style={{ maxWidth: 420 }} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ margin: '0 0 6px' }}>Edit Invoice</h3>
            <p style={{ margin: '0 0 20px', fontSize: 13, color: 'var(--text-muted)' }}>
              <strong style={{ color: 'var(--text)' }}>{editModal.invoiceNumber}</strong>
              {editModal.projectId?.name ? ` · ${editModal.projectId.name}` : ''}
            </p>

            {modalError && <p className="error-msg" style={{ marginBottom: 12 }}>{modalError}</p>}

            <div className="form-group">
              <label>Status</label>
              <select
                value={editStatus}
                onChange={(e) => { setEditStatus(e.target.value); setRejectNote(''); setModalError(''); }}
                disabled={modalLoading}
              >
                <option value="PENDING_APPROVAL">Pending Approval</option>
                <option value="REJECTED">Rejected</option>
              </select>
            </div>

            {editStatus === 'REJECTED' && (
              <div className="form-group">
                <label>Rejection Reason *</label>
                <textarea
                  rows={3}
                  value={rejectNote}
                  onChange={(e) => setRejectNote(e.target.value)}
                  placeholder="Enter reason for rejection…"
                  className="textarea"
                  disabled={modalLoading}
                />
              </div>
            )}

            <div className="form-actions" style={{ marginTop: 20 }}>
              <button
                className="btn btn-primary"
                onClick={handleSaveStatus}
                disabled={modalLoading || (editStatus === 'REJECTED' && !rejectNote.trim())}
              >
                {modalLoading ? 'Saving…' : 'Save'}
              </button>
              <button className="btn btn-ghost" onClick={closeEdit} disabled={modalLoading}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Client Viewer Pay Confirmation Modal  */}
      {payModal && (
        <div className="modal-backdrop" onClick={closePayModal}>
          <div className="modal" style={{ maxWidth: 400 }} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ margin: '0 0 8px' }}>Confirm Payment</h3>
            <p style={{ margin: '0 0 4px', fontSize: 14 }}>
              Are you sure you want to mark this invoice as <strong>Paid</strong>?
            </p>
            <p style={{ margin: '0 0 20px', fontSize: 13, color: 'var(--text-muted)' }}>
              <strong style={{ color: 'var(--text)' }}>{payModal.invoiceNumber}</strong>
              {payModal.projectId?.name ? ` · ${payModal.projectId.name}` : ''}
              {' — '}<strong>{fmt(payModal.total)}</strong>
            </p>

            <p style={{
              margin: '0 0 20px',
              fontSize: 12,
              color: 'var(--text-muted)',
              background: '#f8fafc',
              padding: '10px 12px',
              borderRadius: 'var(--radius)',
              border: '1px solid var(--border)',
            }}>
              This action cannot be undone.
            </p>

            {payError && <p className="error-msg" style={{ marginBottom: 12 }}>{payError}</p>}

            <div className="form-actions">
              <button
                className="btn btn-success"
                onClick={handleClientPay}
                disabled={payLoading}
              >
                {payLoading ? 'Processing…' : 'Yes, Mark as Paid'}
              </button>
              <button className="btn btn-ghost" onClick={closePayModal} disabled={payLoading}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InvoiceList;
