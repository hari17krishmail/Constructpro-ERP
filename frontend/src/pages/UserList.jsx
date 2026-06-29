import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/client';
import { useToast } from '../components/Toast';
import ConfirmModal from '../components/ConfirmModal';
import Pagination from '../components/Pagination';

const ROLE_LABEL = {
  ACCOUNTANT: 'Accountant',
  PROJECT_MANAGER: 'Project Manager',
};

const UserList = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterRole, setFilterRole] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 10;

  const load = async (role = '') => {
    setLoading(true);
    try {
      const params = role ? { role } : {};
      const { data } = await api.get('/users', { params });
      setUsers(data);
    } catch {
      setError('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleRoleFilter = (e) => {
    const role = e.target.value;
    setFilterRole(role);
    setPage(1);
    load(role);
  };

  const confirmDelete = async () => {
    setDeleteLoading(true);
    try {
      await api.delete(`/users/${deleteTarget.id}`);
      setUsers((prev) => prev.filter((u) => u._id !== deleteTarget.id));
      setDeleteTarget(null);
      toast('User deleted successfully!');
    } catch {
      setError('Failed to delete user');
      setDeleteLoading(false);
    }
  };

  const totalPages = Math.ceil(users.length / PAGE_SIZE);
  const paginated = users.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  if (loading) return <div className="page-center">Loading users…</div>;

  return (
    <div className="page">
      <div className="page-header">
        <h2>User Management</h2>
        <button className="btn btn-primary" onClick={() => navigate('/users/new')}>
          + New User
        </button>
      </div>

      <div className="filter-bar">
        <select value={filterRole} onChange={handleRoleFilter}>
          <option value="">All Roles</option>
          <option value="ACCOUNTANT">Accountant</option>
          <option value="PROJECT_MANAGER">Project Manager</option>
        </select>
      </div>

      {error && <p className="error-msg">{error}</p>}

      {users.length === 0 ? (
        <div className="empty-state">No users found.</div>
      ) : (
        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>#</th>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {paginated.map((u, i) => (
                <tr key={u._id}>
                  <td style={{ color: 'var(--text-muted)', fontSize: 12 }}>{u.clientId ?? i + 1}</td>
                  <td style={{ fontWeight: 600 }}>{u.name}</td>
                  <td>{u.email}</td>
                  <td><span className="role-tag">{ROLE_LABEL[u.role] || u.role}</span></td>
                  <td>
                    <span style={{ color: u.isActive ? 'var(--success)' : 'var(--danger)', fontWeight: 600, fontSize: 12 }}>
                      {u.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button className="btn btn-secondary btn-sm" onClick={() => navigate(`/users/${u._id}/edit`)}>Edit</button>
                      <button className="btn btn-danger btn-sm" onClick={() => setDeleteTarget({ id: u._id, name: u.name })}>Delete</button>
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
            totalItems={users.length}
            pageSize={PAGE_SIZE}
          />
        </div>
      )}

      {deleteTarget && (
        <ConfirmModal
          title="Delete User"
          message={`Are you sure you want to delete "${deleteTarget.name}"? This cannot be undone.`}
          onConfirm={confirmDelete}
          onCancel={() => setDeleteTarget(null)}
          loading={deleteLoading}
        />
      )}
    </div>
  );
};

export default UserList;
