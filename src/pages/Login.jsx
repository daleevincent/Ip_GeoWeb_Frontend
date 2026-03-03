import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "../styles/global.css";

function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) navigate("/");
  }, [navigate]);

  const handleLogin = async () => {
    setError("");
    if (!email || !password) {
      setError("Please enter both email and password.");
      return;
    }
    setLoading(true);
    try {
      const response = await axios.post("https://ip-geo-web-backend.vercel.app/api/login", { email, password });
      localStorage.setItem("token", response.data.token);
      navigate("/");
    } catch (err) {
      setError(err.response?.data?.message || "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") handleLogin();
  };

  return (
    <div className="login-wrapper">
      <div className="login-box">
        {/* Logo */}
        <div className="login-logo">
          <div className="logo-icon">🌐</div>
          <h2>GeoTracer</h2>
          <p>Sign in to explore IP geolocation</p>
        </div>

        {/* Card */}
        <div className="login-card">
          {error && (
            <div className="error" style={{ marginBottom: "16px" }}>
              ⚠️ {error}
            </div>
          )}

          <div className="form-group">
            <label htmlFor="email">Email address</label>
            <input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={handleKeyDown}
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={handleKeyDown}
            />
          </div>

          <button
            className="btn-primary-full"
            onClick={handleLogin}
            disabled={loading}
            style={{ opacity: loading ? 0.7 : 1, cursor: loading ? "not-allowed" : "pointer" }}
          >
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default Login;