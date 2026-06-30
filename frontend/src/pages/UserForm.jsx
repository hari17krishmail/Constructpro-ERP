import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../api/client';
import { useToast } from '../components/Toast';

const UserForm = () => {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const toast = useToast();

  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'ACCOUNTANT' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isEdit) {
      api.get(`/users/${id}`)
        .then(({ data }) => setForm({
          name: data.name,
          email: data.email,
          password: '',
          role: data.role,
        }))
        .catch(() => setError('Failed to load user'));
    }
  }, [id, isEdit]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const payload = { name: form.name, email: form.email, role: form.role };
      if (form.password) payload.password = form.password;
      if (isEdit) {
        await api.put(`/users/${id}`, payload);
        toast('User updated successfully!');
      } else {
        await api.post('/users', { ...payload, password: form.password });
        toast('User created successfully!');
      }
      navigate('/users');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save user');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="page">
      <div className="page-header">
        <h2>{isEdit ? 'Edit User' : 'New User'}</h2>
        <button className="btn btn-ghost" onClick={() => navigate('/users')}>Cancel</button>
      </div>

      {error && <p className="error-msg">{error}</p>}

      <form onSubmit={handleSubmit} className="simple-form">
        <div className="form-group">
          <label>Full Name *</label>
          <input
            type="text"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="e.g. John Smith"
            required
          />
        </div>

        <div className="form-group">
          <label>Email *</label>
          <input
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            placeholder="user@example.com"
            required
          />
        </div>

        <div className="form-group">
          <label>
            Password {isEdit && <span className="hint">(leave blank to keep current)</span>}
          </label>
          <input
            type="password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            placeholder={isEdit ? '••••••••' : 'Set password'}
            required={!isEdit}
          />
        </div>

        <div className="form-group">
          <label>Role *</label>
          <select
            value={form.role}
            onChange={(e) => setForm({ ...form, role: e.target.value })}
          >
            <option value="ACCOUNTANT">Accountant</option>
            <option value="PROJECT_MANAGER">Project Manager</option>
          </select>
        </div>

        <div className="form-actions">
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Create User'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default UserForm;
