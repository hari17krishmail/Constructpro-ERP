import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';
import ConfirmModal from '../components/ConfirmModal';
import Pagination from '../components/Pagination';

const ProjectList = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const toast = useToast();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 10;

  const isAdmin = user?.role === 'ADMIN';

  useEffect(() => {
    api.get('/projects')
      .then(({ data }) => setProjects(data))
      .catch(() => setError('Failed to load projects'))
      .finally(() => setLoading(false));
  }, []);

  const confirmDelete = async () => {
    setDeleteLoading(true);
    try {
      await api.delete(`/projects/${deleteTarget.id}`);
      setProjects((prev) => prev.filter((p) => p._id !== deleteTarget.id));
      setDeleteTarget(null);
      toast('Project deleted successfully!');
    } catch {
      setError('Failed to delete project');
      setDeleteLoading(false);
    }
  };

  const totalPages = Math.ceil(projects.length / PAGE_SIZE);
  const paginated = projects.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  if (loading) return <div className="page-center">Loading projects…</div>;

  return (
    <div className="page">
      <div className="page-header">
        <h2>Projects</h2>
        {isAdmin && (
          <button className="btn btn-primary" onClick={() => navigate('/projects/new')}>
            + New Project
          </button>
        )}
      </div>

      {error && <p className="error-msg">{error}</p>}

      {projects.length === 0 ? (
        <div className="empty-state">No projects yet.</div>
      ) : (
        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>Project Name</th>
                <th>Price</th>
                <th>Created</th>
                {isAdmin && <th></th>}
              </tr>
            </thead>
            <tbody>
              {paginated.map((p) => (
                <tr key={p._id}>
                  <td style={{ fontWeight: 600 }}>{p.name}</td>
                  <td>{p.price ?? '—'}</td>
                  <td style={{ color: 'var(--text-muted)', fontSize: 12 }}>
                    {new Date(p.createdAt).toLocaleDateString()}
                  </td>
                  {isAdmin && (
                    <td>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button className="btn btn-secondary btn-sm" onClick={() => navigate(`/projects/${p._id}/edit`)}>Edit</button>
                        <button className="btn btn-danger btn-sm" onClick={() => setDeleteTarget({ id: p._id, name: p.name })}>Delete</button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
          <Pagination
            page={page}
            totalPages={totalPages}
            onPageChange={setPage}
            totalItems={projects.length}
            pageSize={PAGE_SIZE}
          />
        </div>
      )}

      {deleteTarget && (
        <ConfirmModal
          title="Delete Project"
          message={`Are you sure you want to delete "${deleteTarget.name}"? This cannot be undone.`}
          onConfirm={confirmDelete}
          onCancel={() => setDeleteTarget(null)}
          loading={deleteLoading}
        />
      )}
    </div>
  );
};

export default ProjectList;
