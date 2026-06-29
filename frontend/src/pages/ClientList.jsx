import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/client';
import { useToast } from '../components/Toast';
import ConfirmModal from '../components/ConfirmModal';
import Pagination from '../components/Pagination';

const ClientList = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 10;

  useEffect(() => {
    api.get('/clients')
      .then(({ data }) => setClients(data))
      .catch(() => setError('Failed to load clients'))
      .finally(() => setLoading(false));
  }, []);

  const confirmDelete = async () => {
    setDeleteLoading(true);
    try {
      await api.delete(`/clients/${deleteTarget.id}`);
      setClients((prev) => prev.filter((c) => c._id !== deleteTarget.id));
      setDeleteTarget(null);
      toast('Client deleted successfully!');
    } catch {
      setError('Failed to delete client');
      setDeleteLoading(false);
    }
  };

  const filtered = search.trim()
    ? clients.filter(
        (c) =>
          c.name.toLowerCase().includes(search.toLowerCase()) ||
          c.email.toLowerCase().includes(search.toLowerCase())
      )
    : clients;

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleSearch = (val) => {
    setSearch(val);
    setPage(1);
  };

  if (loading) return <div className="page-center">Loading clients…</div>;

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h2>Clients</h2>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--text-muted)' }}>
            {clients.length} client{clients.length !== 1 ? 's' : ''} registered
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => navigate('/clients/new')}>
          + New Client
        </button>
      </div>

      <div className="filter-bar">
        <input
          type="text"
          placeholder="Search by name or email…"
          value={search}
          onChange={(e) => handleSearch(e.target.value)}
          style={{ flex: 1, minWidth: 200, padding: '7px 12px', border: '1px solid var(--border)', borderRadius: 'var(--radius)', fontSize: 13, background: 'var(--bg)', color: 'var(--text)' }}
        />
        {search && (
          <button className="btn btn-ghost btn-sm" onClick={() => handleSearch('')}>Clear</button>
        )}
      </div>

      {error && <p className="error-msg">{error}</p>}

      {filtered.length === 0 ? (
        <div className="empty-state">
          {search ? `No clients match "${search}".` : 'No clients yet. Create one to get started.'}
        </div>
      ) : (
        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>Client ID</th>
                <th>Company Name</th>
                <th>Email</th>
                <th>Status</th>
                <th>Created</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {paginated.map((c) => (
                <tr key={c._id}>
                  <td>
                    <span style={{ fontFamily: 'monospace', fontWeight: 600, color: 'var(--primary)' }}>
                      #{String(c.clientId ?? '—').padStart(3, '0')}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'var(--primary-light)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 13, flexShrink: 0 }}>
                        {c.name[0].toUpperCase()}
                      </div>
                      <span style={{ fontWeight: 600 }}>{c.name}</span>
                    </div>
                  </td>
                  <td style={{ color: 'var(--text-muted)' }}>{c.email}</td>
                  <td>
                    <span style={{ display: 'inline-block', padding: '2px 10px', borderRadius: 10, fontSize: 11, fontWeight: 600, background: c.isActive ? '#dcfce7' : '#fee2e2', color: c.isActive ? '#15803d' : '#b91c1c' }}>
                      {c.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td style={{ color: 'var(--text-muted)', fontSize: 12 }}>
                    {new Date(c.createdAt).toLocaleDateString('en-US', { dateStyle: 'medium' })}
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button className="btn btn-secondary btn-sm" onClick={() => navigate(`/clients/${c._id}/edit`)}>Edit</button>
                      <button className="btn btn-danger btn-sm" onClick={() => setDeleteTarget({ id: c._id, name: c.name })}>Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <Pagination
            page={page}
            totalPages={totalPages}
            onPageChange={setPage}
            totalItems={filtered.length}
            pageSize={PAGE_SIZE}
          />
        </div>
      )}

      {deleteTarget && (
        <ConfirmModal
          title="Delete Client"
          message={`Are you sure you want to delete "${deleteTarget.name}"? This cannot be undone.`}
          onConfirm={confirmDelete}
          onCancel={() => setDeleteTarget(null)}
          loading={deleteLoading}
        />
      )}
    </div>
  );
};

export default ClientList;
