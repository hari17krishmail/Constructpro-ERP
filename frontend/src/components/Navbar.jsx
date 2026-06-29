import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ROLE_LABELS = {
  ADMIN: 'Admin',
  ACCOUNTANT: 'Accountant',
  PROJECT_MANAGER: 'Project Manager',
  CLIENT_VIEWER: 'Client Viewer',
};

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isAdmin = user?.role === 'ADMIN';
  const canSeeProjects = ['ADMIN', 'ACCOUNTANT', 'PROJECT_MANAGER'].includes(user?.role);

  const link = (to, label) => (
    <NavLink
      key={to}
      to={to}
      className={({ isActive }) => 'nav-link' + (isActive ? ' nav-link-active' : '')}
    >
      {label}
    </NavLink>
  );

  return (
    <nav className="navbar">
      <div className="navbar-left">
        <span className="navbar-brand">ConstructPro ERP</span>
        {user && (
          <div className="navbar-links">
            {isAdmin && link('/dashboard', 'Dashboard')}
            {link('/invoices', 'Invoices')}
            {canSeeProjects && link('/projects', 'Projects')}
            {isAdmin && link('/clients', 'Clients')}
            {isAdmin && link('/users', 'Users')}
          </div>
        )}
      </div>

      {user && (
        <div className="navbar-right">
          <span className="navbar-user">
            {user.name}
            <span className="navbar-role">{ROLE_LABELS[user.role]}</span>
          </span>
          <button className="btn btn-ghost" onClick={handleLogout}>
            Sign out
          </button>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
