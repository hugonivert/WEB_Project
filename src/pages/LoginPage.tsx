import { FormEvent, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AUTH_STORAGE_KEY } from "../lib/auth";

type AuthMode = "login" | "signup";

interface FormState {
  displayName: string;
  email: string;
  password: string;
  confirmPassword: string;
}

type AuthResponse = {
  user: {
    id: string;
    email: string;
    displayName: string;
    avatarUrl?: string | null;
  };
  token: string;
};

const initialState: FormState = {
  displayName: "",
  email: "",
  password: "",
  confirmPassword: "",
};

export default function LoginPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<AuthMode>("login");
  const [form, setForm] = useState<FormState>(initialState);
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [info, setInfo] = useState<string>("");

  const isSignup = mode === "signup";

  const canSubmit = useMemo(() => {
    if (!form.email.trim() || !form.password.trim()) return false;
    if (isSignup) {
      if (!form.displayName.trim()) return false;
      if (!form.confirmPassword.trim()) return false;
    }
    return true;
  }, [form, isSignup]);

  const onChange = (key: keyof FormState, value: string) => {
    setError("");
    setInfo("");
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const validate = (): boolean => {
    if (!form.email.includes("@")) {
      setError("Please enter a valid email address.");
      return false;
    }

    if (form.password.length < 6) {
      setError("Password must contain at least 6 characters.");
      return false;
    }

    if (isSignup && form.password !== form.confirmPassword) {
      setError("Passwords do not match.");
      return false;
    }

    return true;
  };

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!validate()) return;

    try {
      setLoading(true);
      setInfo(isSignup ? "Creating account..." : "Signing in...");

      const endpoint = isSignup ? "/api/auth/signup" : "/api/auth/login";
      const body = isSignup
        ? {
            email: form.email,
            password: form.password,
            displayName: form.displayName,
          }
        : {
            email: form.email,
            password: form.password,
          };

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        if (response.status === 401) {
          setError("Incorrect email or password.");
          setInfo("");
          return;
        }
        if (response.status === 409) {
          setError("This email is already in use.");
          setInfo("");
          return;
        }

        const maybeJson = await response
          .json()
          .catch(() => ({ message: "An error occurred." }));
        setError(maybeJson?.message ?? "An error occurred.");
        setInfo("");
        return;
      }

      const data = (await response.json()) as AuthResponse;

      if (!data?.token || !data?.user?.email) {
        setError("Invalid server response.");
        return;
      }

      localStorage.setItem(
        AUTH_STORAGE_KEY,
        JSON.stringify({
          token: data.token,
          user: data.user,
          loggedInAt: new Date().toISOString(),
        }),
      );

      setInfo("");
      navigate("/planner");
    } catch {
      setError("An error occurred. Please try again.");
      setInfo("");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-shell">
      <div className="login-panel">
        <div>
          <p className="eyebrow"></p>
          <h1 className="login-title">
            {isSignup ? "FitQuest" : "FitQuest"}
          </h1>
          <p className="route-copy">
            {isSignup
              ? "Create your account to access planning and performance stats."
              : ""}
          </p>
        </div>

        <div className="login-actions" style={{ marginTop: 14 }}>
          <button
            type="button"
            className={mode === "login" ? "primary-button" : "secondary-button"}
            disabled={loading}
            onClick={() => {
              setMode("login");
              setError("");
            }}
          >
            Sign in
          </button>
          <button
            type="button"
            className={
              mode === "signup" ? "primary-button" : "secondary-button"
            }
            disabled={loading}
            onClick={() => {
              setMode("signup");
              setError("");
            }}
          >
            Create an account
          </button>
        </div>

        <form className="login-form" onSubmit={onSubmit}>
          {isSignup && (
            <div>
              <label className="field-label" htmlFor="signup-name">
                Name
              </label>
              <input
                id="signup-name"
                className="field-input"
                type="text"
                placeholder="Your name"
                value={form.displayName}
                onChange={(e) => onChange("displayName", e.target.value)}
              />
            </div>
          )}

          <div>
            <label className="field-label" htmlFor="auth-email">
              Email
            </label>
            <input
              id="auth-email"
              className="field-input"
              type="email"
              placeholder="you@example.com"
              value={form.email}
              onChange={(e) => onChange("email", e.target.value)}
            />
          </div>

          <div>
            <label className="field-label" htmlFor="auth-password">
              Password
            </label>
            <input
              id="auth-password"
              className="field-input"
              type="password"
              placeholder="••••••••"
              value={form.password}
              onChange={(e) => onChange("password", e.target.value)}
            />
          </div>

          {isSignup && (
            <div>
              <label className="field-label" htmlFor="auth-confirm">
                Confirm password
              </label>
              <input
                id="auth-confirm"
                className="field-input"
                type="password"
                placeholder="••••••••"
                value={form.confirmPassword}
                onChange={(e) => onChange("confirmPassword", e.target.value)}
              />
            </div>
          )}

          {error ? (
            <div className="user-badge" style={{ background: "#fff5f5" }}>
              <span style={{ color: "#dc2626" }}>{error}</span>
            </div>
          ) : null}

          {info ? (
            <div className="user-badge" style={{ background: "#f0f9ff" }}>
              <span style={{ color: "#0369a1" }}>{info}</span>
            </div>
          ) : null}

          <div className="login-actions">
            <button
              type="submit"
              className="primary-button"
              disabled={!canSubmit || loading}
              style={
                !canSubmit || loading
                  ? { opacity: 0.7, cursor: "not-allowed" }
                  : undefined
              }
            >
              {loading
                ? "Loading..."
                : isSignup
                  ? "Create my account"
                  : "Sign in"}
            </button>
            <button
              type="button"
              className="secondary-button"
              onClick={() => {
                setForm(initialState);
                setError("");
              }}
            >
              Clear
            </button>
          </div>
        </form>

        {!isSignup ? (
          <div className="section-card login-notes">
            <h2 className="section-card-title">Note</h2>
            <p className="section-card-copy">
              If you do not have an account yet, use "Create an account".
            </p>
          </div>
        ) : null}
      </div>
    </div>
  );
}
