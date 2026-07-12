import { useCallback, useEffect, useState } from "react";

import { ApiTokensAPI, WebhooksAPI, errMsg } from "../api/client";
import { useToast } from "../contexts/ToastContext";

// Reveal a one-time secret (token or webhook signing secret).
function SecretModal({ title, value, onClose }) {
  const { push } = useToast();
  return (
    <>
      <div className="modal d-block" tabIndex="-1"><div className="modal-dialog">
        <div className="modal-content">
          <div className="modal-header"><h5 className="modal-title">{title}</h5>
            <button type="button" className="btn-close" onClick={onClose} /></div>
          <div className="modal-body">
            <p className="small text-secondary">Copiez cette valeur maintenant — elle ne sera plus affichée.</p>
            <div className="input-group">
              <input className="form-control font-monospace" readOnly value={value} />
              <button className="btn btn-outline-secondary" onClick={() => {
                navigator.clipboard?.writeText(value); push("Copié"); }}>
                <i className="bi bi-clipboard" /></button>
            </div>
          </div>
          <div className="modal-footer"><button className="btn btn-primary" onClick={onClose}>J'ai copié</button></div>
        </div>
      </div></div>
      <div className="modal-backdrop show" />
    </>
  );
}

// ── API tokens ──────────────────────────────────────────────────────
function Tokens() {
  const { push } = useToast();
  const [items, setItems] = useState([]);
  const [name, setName] = useState("");
  const [scopes, setScopes] = useState(["read"]);
  const [reveal, setReveal] = useState(null);

  const load = useCallback(() => {
    ApiTokensAPI.list({ per_page: 100 }).then((d) => setItems(d.items || [])).catch(() => {});
  }, []);
  useEffect(load, [load]);

  const toggleScope = (s) =>
    setScopes((cur) => cur.includes(s) ? cur.filter((x) => x !== s) : [...cur, s]);

  const create = async () => {
    if (!name.trim()) return;
    try {
      const created = await ApiTokensAPI.create({ name, scopes });
      setReveal({ title: "Nouveau jeton d'API", value: created.token });
      setName(""); setScopes(["read"]); load();
    } catch (err) { push(errMsg(err, "Création impossible"), "error"); }
  };

  const revoke = async (t) => {
    if (!window.confirm(`Révoquer « ${t.name} » ?`)) return;
    try { await ApiTokensAPI.remove(t.id); push("Jeton révoqué"); load(); }
    catch (err) { push(errMsg(err, "Révocation impossible"), "error"); }
  };

  return (
    <div className="card border-0 shadow-sm mb-4"><div className="card-body">
      <h2 className="h6 mb-3"><i className="bi bi-key me-2" />Jetons d'API</h2>
      <div className="row g-2 align-items-end mb-3">
        <div className="col-md-5">
          <label className="form-label small">Nom</label>
          <input className="form-control form-control-sm" value={name}
                 onChange={(e) => setName(e.target.value)} placeholder="Site Next.js" />
        </div>
        <div className="col-md-4 d-flex gap-3 align-items-center">
          {["read", "write"].map((s) => (
            <div className="form-check" key={s}>
              <input className="form-check-input" type="checkbox" id={`sc-${s}`}
                     checked={scopes.includes(s)} onChange={() => toggleScope(s)} />
              <label className="form-check-label small" htmlFor={`sc-${s}`}>{s === "read" ? "Lecture" : "Écriture"}</label>
            </div>
          ))}
        </div>
        <div className="col-md-3">
          <button className="btn btn-primary btn-sm w-100" onClick={create} disabled={!name.trim()}>
            <i className="bi bi-plus-lg me-1" />Générer
          </button>
        </div>
      </div>
      <table className="table table-sm align-middle mb-0">
        <thead className="table-light"><tr><th>Nom</th><th>Préfixe</th><th>Portées</th><th>Dernier usage</th><th></th></tr></thead>
        <tbody>
          {items.length === 0 ? <tr><td colSpan="5" className="text-secondary text-center py-3">Aucun jeton.</td></tr>
            : items.map((t) => (
              <tr key={t.id}>
                <td className="fw-medium">{t.name}</td>
                <td><code>{t.prefix}…</code></td>
                <td>{(t.scopes || []).map((s) => <span key={s} className="badge text-bg-secondary me-1">{s}</span>)}</td>
                <td className="text-secondary small">{t.last_used_at ? new Date(t.last_used_at).toLocaleString("fr-FR") : "jamais"}</td>
                <td className="text-end"><button className="btn btn-outline-danger btn-sm" onClick={() => revoke(t)}><i className="bi bi-trash" /></button></td>
              </tr>
            ))}
        </tbody>
      </table>
      {reveal && <SecretModal {...reveal} onClose={() => setReveal(null)} />}
    </div></div>
  );
}

// ── Webhooks ────────────────────────────────────────────────────────
function Webhooks() {
  const { push } = useToast();
  const [items, setItems] = useState([]);
  const [events, setEvents] = useState([]);
  const [form, setForm] = useState({ name: "", url: "", events: [] });
  const [reveal, setReveal] = useState(null);

  const load = useCallback(() => {
    WebhooksAPI.list({ per_page: 100 }).then((d) => setItems(d.items || [])).catch(() => {});
  }, []);
  useEffect(() => { load(); WebhooksAPI.events().then(setEvents).catch(() => {}); }, [load]);

  const toggleEvent = (e) => setForm((f) => ({ ...f,
    events: f.events.includes(e) ? f.events.filter((x) => x !== e) : [...f.events, e] }));

  const create = async () => {
    if (!form.name.trim() || !form.url.trim()) return;
    try {
      const created = await WebhooksAPI.create(form);
      setReveal({ title: "Secret du webhook (signature HMAC)", value: created.secret });
      setForm({ name: "", url: "", events: [] }); load();
    } catch (err) { push(errMsg(err, "Création impossible"), "error"); }
  };

  const toggleActive = async (h) => {
    try { await WebhooksAPI.update(h.id, { is_active: !h.is_active }); load(); }
    catch (err) { push(errMsg(err, "Mise à jour impossible"), "error"); }
  };

  const del = async (h) => {
    if (!window.confirm(`Supprimer « ${h.name} » ?`)) return;
    try { await WebhooksAPI.remove(h.id); push("Webhook supprimé"); load(); }
    catch (err) { push(errMsg(err, "Suppression impossible"), "error"); }
  };

  return (
    <div className="card border-0 shadow-sm"><div className="card-body">
      <h2 className="h6 mb-3"><i className="bi bi-broadcast me-2" />Webhooks</h2>
      <div className="row g-2 align-items-end mb-2">
        <div className="col-md-4">
          <label className="form-label small">Nom</label>
          <input className="form-control form-control-sm" value={form.name}
                 onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Déploiement Netlify" />
        </div>
        <div className="col-md-5">
          <label className="form-label small">URL</label>
          <input className="form-control form-control-sm" value={form.url}
                 onChange={(e) => setForm({ ...form, url: e.target.value })} placeholder="https://api.netlify.com/build_hooks/…" />
        </div>
        <div className="col-md-3">
          <button className="btn btn-primary btn-sm w-100" onClick={create}
                  disabled={!form.name.trim() || !form.url.trim()}><i className="bi bi-plus-lg me-1" />Créer</button>
        </div>
      </div>
      <div className="mb-3 d-flex flex-wrap gap-2">
        {events.map((e) => (
          <div className="form-check" key={e}>
            <input className="form-check-input" type="checkbox" id={`ev-${e}`}
                   checked={form.events.includes(e)} onChange={() => toggleEvent(e)} />
            <label className="form-check-label small font-monospace" htmlFor={`ev-${e}`}>{e}</label>
          </div>
        ))}
      </div>
      <table className="table table-sm align-middle mb-0">
        <thead className="table-light"><tr><th>Nom</th><th>URL</th><th>Événements</th><th>Actif</th><th>Dernier statut</th><th></th></tr></thead>
        <tbody>
          {items.length === 0 ? <tr><td colSpan="6" className="text-secondary text-center py-3">Aucun webhook.</td></tr>
            : items.map((h) => (
              <tr key={h.id}>
                <td className="fw-medium">{h.name}</td>
                <td className="text-secondary small text-truncate" style={{ maxWidth: 180 }}>{h.url}</td>
                <td>{(h.events || []).length}</td>
                <td>
                  <div className="form-check form-switch mb-0">
                    <input className="form-check-input" type="checkbox" checked={h.is_active} onChange={() => toggleActive(h)} />
                  </div>
                </td>
                <td className="text-secondary small">{h.last_status ?? "—"}</td>
                <td className="text-end"><button className="btn btn-outline-danger btn-sm" onClick={() => del(h)}><i className="bi bi-trash" /></button></td>
              </tr>
            ))}
        </tbody>
      </table>
      {reveal && <SecretModal {...reveal} onClose={() => setReveal(null)} />}
    </div></div>
  );
}

export function Integrations() {
  return (
    <div>
      <h1 className="h4 mb-1">Intégrations</h1>
      <p className="text-secondary small mb-4">
        Jetons d'API pour consommer le CMS en headless (Bearer) et webhooks pour notifier vos services à la publication.
      </p>
      <Tokens />
      <Webhooks />
    </div>
  );
}
