import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../api/client';
import { useToast } from '../components/Toast';

const CATEGORIES = ['LABOR', 'MATERIALS', 'EQUIPMENT', 'OTHER'];

const emptyLine = () => ({
  description: '',
  category: 'LABOR',
  quantity: 1,
  unitPrice: 0,
  lineTotal: 0,
});

const fmt = (n) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n || 0);

const InvoiceForm = () => {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const toast = useToast();

  const [projects, setProjects] = useState([]);
  const [clients, setClients] = useState([]);
  const [form, setForm] = useState({
    projectId: '',
    client: '',
    issueDate: '',
    dueDate: '',
    taxRate: 10,
    lineItems: [emptyLine()],
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const calcTotals = (items, rate) => {
    const subtotal = items.reduce((sum, i) => sum + i.quantity * i.unitPrice, 0);
    const taxAmount = (subtotal * (rate || 0)) / 100;
    return { subtotal, taxAmount, total: subtotal + taxAmount };
  };

  const totals = calcTotals(form.lineItems, form.taxRate);

  useEffect(() => {
    Promise.all([api.get('/projects'), api.get('/clients')]).then(
      ([projRes, clientRes]) => {
        setProjects(projRes.data);
        setClients(clientRes.data.filter((c) => c.isActive));
      }
    );

    if (isEdit) {
      api.get(`/invoices/${id}`).then(({ data }) => {
        if (data.status !== 'DRAFT') {
          navigate(`/invoices/${id}`);
          return;
        }
        setForm({
          projectId: data.projectId?._id || '',
          client: data.client?._id || '',
          issueDate: data.issueDate?.split('T')[0] || '',
          dueDate: data.dueDate?.split('T')[0] || '',
          taxRate: data.taxRate,
          lineItems: data.lineItems.map((li) => ({
            description: li.description,
            category: li.category,
            quantity: li.quantity,
            unitPrice: li.unitPrice,
            lineTotal: li.lineTotal,
          })),
        });
      });
    }
  }, [id, isEdit, navigate]);

  const updateLine = (index, field, value) => {
    setForm((prev) => {
      const items = prev.lineItems.map((item, i) => {
        if (i !== index) return item;
        const updated = {
          ...item,
          [field]: field === 'description' || field === 'category' ? value : Number(value),
        };
        updated.lineTotal = updated.quantity * updated.unitPrice;
        return updated;
      });
      return { ...prev, lineItems: items };
    });
  };

  const addLine = () =>
    setForm((prev) => ({ ...prev, lineItems: [...prev.lineItems, emptyLine()] }));

  const removeLine = (index) =>
    setForm((prev) => ({
      ...prev,
      lineItems: prev.lineItems.filter((_, i) => i !== index),
    }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.lineItems.length === 0) {
      setError('Add at least one line item');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const payload = { ...form, client: form.client || null };
      const { data } = isEdit
        ? await api.put(`/invoices/${id}`, payload)
        : await api.post('/invoices', payload);
      toast(isEdit ? 'Invoice updated successfully!' : 'Invoice created successfully!');
      navigate(`/invoices/${data._id}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save invoice');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <button className="btn btn-ghost btn-sm" onClick={() => navigate('/invoices')}>
            ← Invoices
          </button>
          <h2 style={{ margin: '8px 0 0' }}>{isEdit ? 'Edit Invoice' : 'New Invoice'}</h2>
        </div>
      </div>

      {error && <p className="error-msg">{error}</p>}

      <form onSubmit={handleSubmit} className="invoice-form">
        {/* Header fields */}
        <div className="form-grid">
          <div className="form-group">
            <label>Project *</label>
            <select
              value={form.projectId}
              onChange={(e) => setForm({ ...form, projectId: e.target.value })}
              required
            >
              <option value="">Select project…</option>
              {projects.map((p) => (
                <option key={p._id} value={p._id}>{p.name}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Client</label>
            <select
              value={form.client}
              onChange={(e) => setForm({ ...form, client: e.target.value })}
            >
              <option value="">Select client…</option>
              {clients.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name}{c.clientId ? ` (#${String(c.clientId).padStart(3, '0')})` : ''}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Issue Date *</label>
            <input
              type="date"
              value={form.issueDate}
              onChange={(e) => setForm({ ...form, issueDate: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label>Due Date *</label>
            <input
              type="date"
              value={form.dueDate}
              onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label>Tax Rate (%)</label>
            <input
              type="number"
              min="0"
              max="100"
              step="0.01"
              value={form.taxRate}
              onChange={(e) => setForm({ ...form, taxRate: parseFloat(e.target.value) || 0 })}
            />
          </div>
        </div>

        {/* Line items */}
        <div className="section-header">
          <h3>Line Items</h3>
          <button type="button" className="btn btn-secondary btn-sm" onClick={addLine}>
            + Add line
          </button>
        </div>

        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>Description</th>
                <th>Category</th>
                <th>Qty</th>
                <th>Unit Price</th>
                <th style={{ textAlign: 'right' }}>Line Total</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {form.lineItems.map((item, i) => (
                <tr key={i}>
                  <td>
                    <input
                      type="text"
                      value={item.description}
                      onChange={(e) => updateLine(i, 'description', e.target.value)}
                      placeholder="Description"
                      required
                      className="input-inline"
                    />
                  </td>
                  <td>
                    <select
                      value={item.category}
                      onChange={(e) => updateLine(i, 'category', e.target.value)}
                      className="input-inline"
                    >
                      {CATEGORIES.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </td>
                  <td>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={item.quantity}
                      onChange={(e) => updateLine(i, 'quantity', e.target.value)}
                      className="input-inline input-num"
                      required
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={item.unitPrice}
                      onChange={(e) => updateLine(i, 'unitPrice', e.target.value)}
                      className="input-inline input-num"
                      required
                    />
                  </td>
                  <td style={{ textAlign: 'right', fontWeight: 600 }}>
                    {fmt(item.quantity * item.unitPrice)}
                  </td>
                  <td>
                    <button
                      type="button"
                      className="btn-icon btn-danger"
                      onClick={() => removeLine(i)}
                      disabled={form.lineItems.length === 1}
                      title="Remove line"
                    >
                      ✕
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals */}
        <div className="totals-box">
          <div className="totals-row">
            <span>Subtotal</span>
            <span>{fmt(totals.subtotal)}</span>
          </div>
          <div className="totals-row">
            <span>Tax ({form.taxRate}%)</span>
            <span>{fmt(totals.taxAmount)}</span>
          </div>
          <div className="totals-row totals-total">
            <span>Total</span>
            <span>{fmt(totals.total)}</span>
          </div>
        </div>

        <div className="form-actions">
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Invoice'}
          </button>
          <button type="button" className="btn btn-ghost" onClick={() => navigate('/invoices')}>
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default InvoiceForm;
