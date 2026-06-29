import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../components/Toast";
import logo from "../assets/logo.svg";

const DEMO_BY_ROLE = {
  ADMIN: [{ label: "Anand Admin", email: "anand@constructpro.com" }],
  ACCOUNTANT: [
    { label: "Roopan Accountant", email: "roopan@constructpro.com" },
  ],
  PROJECT_MANAGER: [
    { label: "John Manager", email: "pm.john@constructpro.com" },
    { label: "Sarah Manager", email: "pm.sarah@constructpro.com" },
  ],
  CLIENT_VIEWER: [
    { label: "BuildRight Corp", email: "client.buildright@constructpro.com" },
    { label: "Skyline Developers", email: "client.skyline@constructpro.com" },
  ],
};

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("password");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const loggedIn = await login(email, password);
      toast("Login successfully!");
      navigate(loggedIn.role === "ADMIN" ? "/dashboard" : "/invoices");
    } catch (err) {
      setError(err.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">

        {/* ── Logo icon ── */}
        <div className="login-logo">
           <img src={logo} alt="logo" className="logo-img"/>
        </div>

        {/* ── Heading ── */}
        <div className="login-heading">
          <h2 className="login-title">ConstructPro ERP</h2>
          <p className="login-subtitle">Invoicing &amp; Billing Module</p>
        </div>
        <form onSubmit={handleSubmit} className="login-form">
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

          <button
            type="submit"
            className="btn btn-primary btn-full"
            disabled={loading}
          >
            {loading ? "Signing in…" : "Sign In"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
