import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../api/client';
import { useToast } from '../components/Toast';

const ProjectForm = () => {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const toast = useToast();


  const [form, setForm] = useState({ name: '', price: '', });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {

    if (isEdit) {
      api.get(`/projects/${id}`).then(({ data }) => {
        setForm({ name: data.name, price: data.price ?? '' });
      }).catch(() => setError('Failed to load project'));
    }
  }, [id, isEdit]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const payload = {
        name: form.name,
        price: form.price,
      };
      if (isEdit) {
        await api.put(`/projects/${id}`, payload);
        toast('Project updated successfully!');
      } else {
        await api.post('/projects', payload);
        toast('Project created successfully!');
      }
      navigate('/projects');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save project');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="page">
      <div className="page-header">
        <h2>{isEdit ? 'Edit Project' : 'New Project'}</h2>
        <button className="btn btn-ghost" onClick={() => navigate('/projects')}>
          Cancel
        </button>
      </div>

      {error && <p className="error-msg">{error}</p>}

      <form onSubmit={handleSubmit} className="simple-form">
        <div className="form-group">
          <label>Project Name *</label>
          <input
            type="text"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="e.g. Downtown Office Complex"
            required
          />
        </div>

        <div className="form-group">
          <label>Price *</label>
          <input
            type="text"
            value={form.price}
            onChange={(e) => setForm({ ...form, price: e.target.value })}
            placeholder="e.g. 1"
            required
          />
        </div>

        <div className="form-actions">
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Project'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ProjectForm;
