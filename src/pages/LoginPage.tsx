import { Link } from "react-router-dom";

export default function LoginPage() {
  return (
    <div className="login-shell">
      <div className="login-panel">
        <div>
          <p className="eyebrow">FitQuest</p>
          <h1 className="login-title">Login to your athlete space</h1>
          <p className="route-copy">
            Minimal authentication page ready for the teammate who will implement
            real login, session handling and API calls.
          </p>
        </div>

        <form className="login-form">
          <label className="field-label" htmlFor="login-email">
            Email
          </label>
          <input
            id="login-email"
            className="field-input"
            type="email"
            placeholder="you@example.com"
          />

          <label className="field-label" htmlFor="login-password">
            Password
          </label>
          <input
            id="login-password"
            className="field-input"
            type="password"
            placeholder="••••••••"
          />

          <div className="login-actions">
            <Link to="/planner" className="primary-button login-link">
              Enter demo app
            </Link>
            <button type="button" className="secondary-button">
              Forgot password
            </button>
          </div>
        </form>

        <div className="section-card login-notes">
          <h2 className="section-card-title">Suggested owner</h2>
          <p className="section-card-copy">
            Member 1: authentication flow, protected routes, backend integration.
          </p>
        </div>
      </div>
    </div>
  );
}
