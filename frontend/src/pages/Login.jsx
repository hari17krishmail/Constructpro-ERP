import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';

const ROLES = [
  { value: '', label: 'Select Role' },
  { value: 'ADMIN', label: 'Admin' },
  { value: 'ACCOUNTANT', label: 'Accountant' },
  { value: 'PROJECT_MANAGER', label: 'Project Manager' },
  { value: 'CLIENT_VIEWER', label: 'Client Viewer' },
];

const DEMO_BY_ROLE = {
  ADMIN: [{ label: 'Anand Admin', email: 'anand@constructpro.com' }],
  ACCOUNTANT: [{ label: 'Roopan Accountant', email: 'roopan@constructpro.com' }],
  PROJECT_MANAGER: [
    { label: 'John Manager', email: 'pm.john@constructpro.com' },
    { label: 'Sarah Manager', email: 'pm.sarah@constructpro.com' },
  ],
  CLIENT_VIEWER: [
    { label: 'BuildRight Corp', email: 'client.buildright@constructpro.com' },
    { label: 'Skyline Developers', email: 'client.skyline@constructpro.com' },
  ],
};

const ALL_DEMO = Object.values(DEMO_BY_ROLE).flat();

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const [role, setRole] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('password');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const demoUsers = role ? (DEMO_BY_ROLE[role] || []) : ALL_DEMO;

  const selectDemo = (demoEmail) => {
    setEmail(demoEmail);
    setError('');
  };

  const handleRoleChange = (e) => {
    setRole(e.target.value);
    setEmail('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const loggedIn = await login(email, password);
      toast('Login successfully!');
      navigate(loggedIn.role === 'ADMIN' ? '/dashboard' : '/invoices');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <h1 className="login-title">ConstructPro ERP</h1>
        <p className="login-subtitle">Invoicing &amp; Billing</p>

        <form onSubmit={handleSubmit} className="login-form">
          {/* <div className="form-group">
            <label>Role</label>
            <select value={role} onChange={handleRoleChange}>
              {ROLES.map((r) => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </select>
          </div> */}

          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="Email address"
            />
          </div>

          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {error && <p className="error-msg">{error}</p>}

          <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
            {loading ? 'Signing in…' : 'Login'}
          </button>
        </form>

        {/* <div className="demo-panel" style={{ marginTop: 20 }}>
          <p className="demo-label">Quick login — demo users (password: "password")</p>
          {demoUsers.map((u) => (
            <button
              key={u.email}
              type="button"
              className={`demo-btn ${email === u.email ? 'demo-btn-active' : ''}`}
              onClick={() => selectDemo(u.email)}
            >
              {u.label}
            </button>
          ))}
        </div> */}
      </div>
    </div>
  );
};

export default Login;
