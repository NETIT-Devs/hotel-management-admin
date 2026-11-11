import { useState } from "react";
import { Hotel, LockKeyhole } from "lucide-react";

import { loginAdmin } from "../services/authService";
import "../styles/adminAuth.css";

const LoginPage = ({ onLogin }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const { token, user } = await loginAdmin(email, password);
      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));
      onLogin();
    } catch (loginError) {
      setError(loginError.message || "Unable to sign in.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="admin-login-page">
      <section className="admin-login-card">
        <div className="admin-login-brand">
          <div className="admin-login-icon">
            <Hotel size={26} />
          </div>
          <span>SERENITY BAY</span>
          <small>HOTEL &amp; RESORT</small>
        </div>

        <div className="admin-login-heading">
          <span className="admin-login-lock">
            <LockKeyhole size={18} />
          </span>
          <h1>Admin sign in</h1>
          <p>Sign in with your hotel administrator account.</p>
        </div>

        <form className="admin-login-form" onSubmit={handleSubmit}>
          <label htmlFor="admin-email">Email address</label>
          <input
            id="admin-email"
            type="email"
            autoComplete="username"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="admin@example.com"
            required
          />

          <label htmlFor="admin-password">Password</label>
          <input
            id="admin-password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Enter your password"
            required
          />

          {error && (
            <p className="admin-login-error" role="alert">
              {error}
            </p>
          )}

          <button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Signing in…" : "Sign in to dashboard"}
          </button>
        </form>

        <p className="admin-login-footer">
          Authorized hotel administrators only
        </p>
      </section>
    </main>
  );
};

export default LoginPage;
