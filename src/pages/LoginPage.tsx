import { FormEvent, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

type AuthMode = "login" | "signup";

interface FormState {
  displayName: string;
  email: string;
  password: string;
  confirmPassword: string;
}

const AUTH_STORAGE_KEY = "fitquest_auth";

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
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const validate = (): boolean => {
    if (!form.email.includes("@")) {
      setError("Veuillez entrer un email valide.");
      return false;
    }

    if (form.password.length < 6) {
      setError("Le mot de passe doit contenir au moins 6 caractères.");
      return false;
    }

    if (isSignup && form.password !== form.confirmPassword) {
      setError("Les mots de passe ne correspondent pas.");
      return false;
    }

    return true;
  };

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!validate()) return;

    try {
      setLoading(true);

      // Mock login/signup (on branchera le backend plus tard)
      await new Promise((resolve) => setTimeout(resolve, 400));

      localStorage.setItem(
        AUTH_STORAGE_KEY,
        JSON.stringify({
          email: form.email,
          displayName: form.displayName || "Athlète",
          loggedInAt: new Date().toISOString(),
        }),
      );

      navigate("/planner");
    } catch {
      setError("Une erreur est survenue. Réessaie.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-shell">
      <div className="login-panel">
        <div>
          <p className="eyebrow">FitQuest</p>
          <h1 className="login-title">
            {isSignup ? "Créer un compte" : "Connexion"}
          </h1>
          <p className="route-copy">
            {isSignup
              ? "Crée ton compte pour accéder au planner et aux stats."
              : "Connecte-toi pour accéder à ton espace athlète."}
          </p>
        </div>

        <div className="login-actions" style={{ marginTop: 14 }}>
          <button
            type="button"
            className={mode === "login" ? "primary-button" : "secondary-button"}
            onClick={() => {
              setMode("login");
              setError("");
            }}
          >
            Se connecter
          </button>
          <button
            type="button"
            className={
              mode === "signup" ? "primary-button" : "secondary-button"
            }
            onClick={() => {
              setMode("signup");
              setError("");
            }}
          >
            Créer un compte
          </button>
        </div>

        <form className="login-form" onSubmit={onSubmit}>
          {isSignup && (
            <div>
              <label className="field-label" htmlFor="signup-name">
                Nom
              </label>
              <input
                id="signup-name"
                className="field-input"
                type="text"
                placeholder="Ton nom"
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
              Mot de passe
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
                Confirmer le mot de passe
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
                ? "Chargement..."
                : isSignup
                  ? "Créer mon compte"
                  : "Se connecter"}
            </button>
            <button
              type="button"
              className="secondary-button"
              onClick={() => {
                setForm(initialState);
                setError("");
              }}
            >
              Effacer
            </button>
          </div>
        </form>

        <div className="section-card login-notes">
          <h2 className="section-card-title">Note</h2>
          <p className="section-card-copy">
            Pour l’instant, c’est un login <strong>mock</strong> (pas de
            backend). Prochaine étape : brancher l’API et protéger les routes.
          </p>
        </div>
      </div>
    </div>
  );
}
