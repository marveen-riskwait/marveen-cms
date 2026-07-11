import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { errMsg } from "../api/client";

export function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true); setError("");
    try {
      await login(form.email, form.password);
      navigate(location.state?.from || "/admin", { replace: true });
    } catch (err) {
      setError(errMsg(err, "Connexion impossible."));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mv-login">
      <div className="card">
        <div className="card-body p-4">
          <div className="text-center mb-4">
            <div className="mv-logo fs-3">Marveen<b>CMS</b><i>.</i></div>
            <div className="text-secondary small">Espace d'administration</div>
          </div>
          <form onSubmit={submit}>
            {error && <div className="alert alert-danger py-2 small">{error}</div>}
            <div className="mb-3">
              <label className="form-label small">Email</label>
              <input type="email" className="form-control" required autoFocus
                     value={form.email}
                     onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </div>
            <div className="mb-3">
              <label className="form-label small">Mot de passe</label>
              <input type="password" className="form-control" required
                     value={form.password}
                     onChange={(e) => setForm({ ...form, password: e.target.value })} />
            </div>
            <button className="btn btn-primary w-100" disabled={busy}>
              {busy ? "Connexion…" : "Se connecter"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
