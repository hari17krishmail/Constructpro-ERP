import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../api/client';
import { useToast } from '../components/Toast';

const ClientForm = () => {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const toast = useToast();

  const [form, setForm] = useState({ name: '', email: '', password: '', isActive: true });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isEdit) return;
    api.get(`/clients/${id}`)
      .then(({ data }) =>
        setForm({ name: data.name, email: data.email, password: '', isActive: data.isActive })
      )
      .catch(() => setError('Failed to load client'));
  }, [id, isEdit]);

  const set = (field) => (e) => {
    const val = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setForm((f) => ({ ...f, [field]: val }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      if (isEdit) {
        const payload = { name: form.name, email: form.email, isActive: form.isActive };
        if (form.password) payload.password = form.password;
        await api.put(`/clients/${id}`, payload);
        toast('Client updated successfully!');
      } else {
        await api.post('/clients', {
          name: form.name,
          email: form.email,
          password: form.password || 'password',
        });
        toast('Client created successfully!');
      }
      navigate('/clients');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save client');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <button className="btn btn-ghost btn-sm" onClick={() => navigate('/clients')}>
            ← Clients
          </button>
          <h2 style={{ margin: '8px 0 0' }}>{isEdit ? 'Edit Client' : 'New Client'}</h2>
        </div>
      </div>

      {error && <p className="error-msg">{error}</p>}

      <form onSubmit={handleSubmit} className="simple-form">
        <div className="form-group">
          <label>Company / Client Name *</label>
          <input
            type="text"
            value={form.name}
            onChange={set('name')}
            placeholder="e.g. BuildRight Corp"
            required
          />
        </div>

        <div className="form-group">
          <label>Email Address *</label>
          <input
            type="email"
            value={form.email}
            onChange={set('email')}
            placeholder="contact@company.com"
            required
          />
        </div>

        <div className="form-group">
          <label>
            {isEdit ? 'New Password' : 'Login Password'}
            {!isEdit && <span className="hint"> (default: "password")</span>}
            {isEdit && <span className="hint"> (leave blank to keep current)</span>}
          </label>
          <input
            type="password"
            value={form.password}
            onChange={set('password')}
            placeholder={isEdit ? 'Enter new password…' : 'Set login password'}
            autoComplete="new-password"
          />
        </div>

        {isEdit && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <input
              id="isActive"
              type="checkbox"
              checked={form.isActive}
              onChange={set('isActive')}
              style={{ width: 16, height: 16, cursor: 'pointer' }}
            />
            <label htmlFor="isActive" style={{ margin: 0, cursor: 'pointer', fontSize: 14, color: 'var(--text)' }}>
              Account is active
            </label>
          </div>
        )}

        <div className="form-actions">
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Client'}
          </button>
          <button type="button" className="btn btn-ghost" onClick={() => navigate('/clients')}>
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default ClientForm;
