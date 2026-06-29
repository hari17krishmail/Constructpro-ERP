import { useEffect, useState } from 'react';
import api from '../api/client';

const CARDS = [
  { key: 'totalClients',    label: 'Total Clients',      color: '#6366f1' },
  { key: 'totalPMs',        label: 'Project Managers',   color: '#8b5cf6' },
  { key: 'totalAccountants',label: 'Accountants',        color: '#0ea5e9' },
  { key: 'totalProjects',   label: 'Total Projects',     color: '#14b8a6' },
  { key: 'totalInvoices',   label: 'Total Invoices',     color: '#64748b' },
  // { key: 'draft',           label: 'Draft',              color: '#94a3b8' },
  { key: 'pendingApproval', label: 'Pending Approval',   color: '#f59e0b' },
  { key: 'approved',        label: 'Approved',           color: '#06b6d4' },
  // { key: 'sent',            label: 'Sent',               color: '#3b82f6' },
  { key: 'paid',            label: 'Paid',               color: '#22c55e' },
  { key: 'rejected',        label: 'Rejected',           color: '#ef4444' },
];

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/dashboard')
      .then(({ data }) => setStats(data))
      .catch(() => setError('Failed to load dashboard'));
  }, []);

  if (!stats && !error) return <div className="page-center">Loading…</div>;

  return (
    <div className="page">
      <div className="page-header">
        <h2>Dashboard</h2>
      </div>
      {error && <p className="error-msg">{error}</p>}
      {stats && (
        <div className="dashboard-grid">
          {CARDS.map(({ key, label, color }) => (
            <div key={key} className="stat-card" style={{ borderTop: `3px solid ${color}` }}>
              <div className="stat-value" style={{ color }}>{stats[key]}</div>
              <div className="stat-label">{label}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Dashboard;
