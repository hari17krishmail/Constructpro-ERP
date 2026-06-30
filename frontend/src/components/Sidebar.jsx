import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useToast } from './Toast';

const ROLE_LABELS = {
  ADMIN: 'Admin',
  ACCOUNTANT: 'Accountant',
  PROJECT_MANAGER: 'Project Manager',
  CLIENT_VIEWER: 'Client Viewer',
};

const NAV_ICONS = {
  Dashboard: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
      <rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
    </svg>
  ),
  Invoices: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
      <polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/>
      <line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/>
    </svg>
  ),
  Projects: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 2 2 7 12 12 22 7 12 2"/>
      <polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/>
    </svg>
  ),
  Clients: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
      <circle cx="9" cy="7" r="4"/>
      <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
  ),
  Users: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
      <circle cx="12" cy="7" r="4"/>
    </svg>
  ),
};

const Sidebar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const { theme, toggle } = useTheme();
  const [open, setOpen] = useState(false);
  const [logoutModal, setLogoutModal] = useState(false);

  const close = () => setOpen(false);

  const handleLogout = () => {
    logout();
    toast('Logged out successfully!');
    navigate('/login');
  };

  const isAdmin = user?.role === 'ADMIN';
  const canSeeProjects = user?.role === 'ADMIN';

  const navLink = (to, label) => (
    <NavLink
      key={to}
      to={to}
      className={({ isActive }) => 'sidebar-link' + (isActive ? ' sidebar-link-active' : '')}
      onClick={close}
    >
      <span className="sidebar-icon">{NAV_ICONS[label]}</span>
      {label}
    </NavLink>
  );

  return (
    <>
      {/* Mobile hamburger */}
      <button
        className="sidebar-toggle"
        onClick={() => setOpen((o) => !o)}
        aria-label="Toggle menu"
      >
        {open ? (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        ) : (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="3" y1="7" x2="21" y2="7"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="17" x2="21" y2="17"/>
          </svg>
        )}
      </button>

      {/* Mobile overlay */}
      {open && <div className="sidebar-overlay" onClick={close} />}

      <aside className={`sidebar${open ? ' sidebar-open' : ''}`}>
        {/* Header */}
        <div className="sidebar-header">
          <span className="sidebar-brand">ConstructPro</span>
          <span className="sidebar-brand-sub">Invoicing &amp; Billing ERP</span>
        </div>

        {/* Navigation */}
        <nav className="sidebar-nav">
          {isAdmin && navLink('/dashboard', 'Dashboard')}
          {navLink('/invoices', 'Invoices')}
          {canSeeProjects && navLink('/projects', 'Projects')}
          {isAdmin && navLink('/clients', 'Clients')}
          {isAdmin && navLink('/users', 'Users')}
        </nav>

        {/* Footer — user info + sign out */}
        <div className="sidebar-footer">
          <div className="sidebar-user">
            <div className="sidebar-user-avatar">
              {user?.name?.[0]?.toUpperCase()}
            </div>
            <div className="sidebar-user-info">
              <div className="sidebar-user-name">{user?.name}</div>
              <div className="sidebar-user-role">{ROLE_LABELS[user?.role]}</div>
            </div>
          </div>
          <button className="sidebar-theme-toggle" onClick={toggle} title="Toggle theme">
            {theme === 'light' ? (
              /* Moon — switch to dark */
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
              </svg>
            ) : (
              /* Sun — switch to light */
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="5"/>
                <line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/>
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
                <line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/>
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
              </svg>
            )}
            {theme === 'light' ? 'Dark Mode' : 'Light Mode'}
          </button>

          <button className="sidebar-signout" onClick={() => setLogoutModal(true)}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
              <polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
            Sign out
          </button>
        </div>
      </aside>

      {/* Logout confirmation modal */}
      {logoutModal && (
        <div className="modal-backdrop" onClick={() => setLogoutModal(false)}>
          <div className="modal" style={{ maxWidth: 360 }} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ margin: '0 0 10px' }}>Sign Out</h3>
            <p style={{ margin: '0 0 24px', fontSize: 14, color: 'var(--text-muted)' }}>
              Are you sure you want to logout?
            </p>
            <div className="form-actions">
              <button className="btn btn-danger" onClick={handleLogout}>
                Yes, Logout
              </button>
              <button className="btn btn-ghost" onClick={() => setLogoutModal(false)}>
                No
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Sidebar;
