import { useCallback, useEffect, useState } from "react";

import { RolesAPI, resource, errMsg } from "../api/client";
import { useToast } from "../contexts/ToastContext";

const PER_PAGE = 20;
const api = resource("users");

const fullName = (u) =>
  [u.first_name, u.last_name].filter(Boolean).join(" ") || "—";

// ── Create / edit modal ─────────────────────────────────────────────
function UserForm({ user, roles, onClose, onSaved }) {
  const { push } = useToast();
  const isEdit = !!user;
  const [form, setForm] = useState(() => ({
    email: user?.email || "",
    password: "",
    first_name: user?.first_name || "",
    last_name: user?.last_name || "",
    is_active: user ? !!user.is_active : true,
    is_superadmin: user ? !!user.is_superadmin : false,
    role_ids: user ? roles.filter((r) => user.roles.includes(r.name)).map((r) => r.id) : [],
  }));
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const toggleRole = (id) =>
    setForm((f) => ({
      ...f,
      role_ids: f.role_ids.includes(id)
        ? f.role_ids.filter((x) => x !== id)
        : [...f.role_ids, id],
    }));

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true); setErrors({});
    try {
      const payload = {
        email: form.email,
        first_name: form.first_name,
        last_name: form.last_name,
        is_active: form.is_active,
        is_superadmin: form.is_superadmin,
        role_ids: form.role_ids,
      };
      if (form.password) payload.password = form.password;
      if (isEdit) await api.update(user.id, payload);
      else await api.create(payload);
      push(isEdit ? "Utilisateur modifié" : "Utilisateur créé");
      onSaved();
    } catch (err) {
      const data = err?.response?.data;
      if (data?.errors) setErrors(data.errors);
      push(errMsg(err, "Enregistrement impossible"), "error");
    } finally {
      setBusy(false);
    }
  };

  const invalid = (k) => (errors[k] ? " is-invalid" : "");

  return (
    <>
      <div className="modal d-block" tabIndex="-1">
        <div className="modal-dialog modal-dialog-scrollable">
          <div className="modal-content">
            <form onSubmit={submit}>
              <div className="modal-header">
                <h5 className="modal-title">{isEdit ? "Modifier l'utilisateur" : "Nouvel utilisateur"}</h5>
                <button type="button" className="btn-close" onClick={onClose} />
              </div>
              <div className="modal-body">
                <div className="row g-2">
                  <div className="col-6 mb-2">
                    <label className="form-label small">Prénom</label>
                    <input type="text" className="form-control" value={form.first_name}
                           onChange={(e) => set("first_name", e.target.value)} />
                  </div>
                  <div className="col-6 mb-2">
                    <label className="form-label small">Nom</label>
                    <input type="text" className="form-control" value={form.last_name}
                           onChange={(e) => set("last_name", e.target.value)} />
                  </div>
                </div>
                <div className="mb-2">
                  <label className="form-label small">Email *</label>
                  <input type="email" className={"form-control" + invalid("email")} required
                         value={form.email} onChange={(e) => set("email", e.target.value)} />
                  {errors.email && <div className="invalid-feedback d-block">{String(errors.email)}</div>}
                </div>
                <div className="mb-3">
                  <label className="form-label small">
                    Mot de passe {isEdit ? "(laisser vide pour ne pas changer)" : "*"}
                  </label>
                  <input type="password" className={"form-control" + invalid("password")}
                         required={!isEdit} value={form.password}
                         autoComplete="new-password"
                         onChange={(e) => set("password", e.target.value)} />
                  {errors.password && <div className="invalid-feedback d-block">{String(errors.password)}</div>}
                </div>

                <label className="form-label small d-block">Rôles</label>
                <div className="mb-3">
                  {roles.map((r) => (
                    <div className="form-check" key={r.id}>
                      <input className="form-check-input" type="checkbox" id={`role-${r.id}`}
                             checked={form.role_ids.includes(r.id)}
                             onChange={() => toggleRole(r.id)} />
                      <label className="form-check-label" htmlFor={`role-${r.id}`}>
                        {r.label || r.name}
                        <span className="text-secondary small ms-2">
                          {r.permissions?.length ?? 0} permission(s)</span>
                      </label>
                    </div>
                  ))}
                </div>

                <div className="form-check form-switch mb-2">
                  <input className="form-check-input" type="checkbox" id="is_active"
                         checked={form.is_active} onChange={(e) => set("is_active", e.target.checked)} />
                  <label className="form-check-label" htmlFor="is_active">Compte actif</label>
                </div>
                <div className="form-check form-switch">
                  <input className="form-check-input" type="checkbox" id="is_superadmin"
                         checked={form.is_superadmin}
                         onChange={(e) => set("is_superadmin", e.target.checked)} />
                  <label className="form-check-label" htmlFor="is_superadmin">
                    Super-administrateur <span className="text-secondary small">(tous les droits)</span>
                  </label>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-outline-secondary" onClick={onClose}>Annuler</button>
                <button className="btn btn-primary" disabled={busy}>{busy ? "…" : "Enregistrer"}</button>
              </div>
            </form>
          </div>
        </div>
      </div>
      <div className="modal-backdrop show" />
    </>
  );
}

export function Users() {
  const { push } = useToast();
  const [items, setItems] = useState([]);
  const [meta, setMeta] = useState(null);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [q, setQ] = useState("");
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState(null); // { user } | { user: null } | null

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, per_page: PER_PAGE };
      if (search) params.q = search;
      const data = await api.list(params);
      setItems(data.items || []);
      setMeta(data.meta || null);
    } catch (err) {
      push(errMsg(err, "Chargement impossible"), "error");
    } finally {
      setLoading(false);
    }
  }, [page, search, push]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { RolesAPI.list().then(setRoles).catch(() => setRoles([])); }, []);

  const del = async (u) => {
    if (!window.confirm(`Supprimer « ${u.email} » ?`)) return;
    try {
      await api.remove(u.id);
      push("Utilisateur supprimé");
      if (items.length === 1 && page > 1) setPage((p) => p - 1);
      else load();
    } catch (err) {
      push(errMsg(err, "Suppression impossible"), "error");
    }
  };

  const onSaved = () => { setEditing(null); load(); };
  const submitSearch = (e) => { e.preventDefault(); setPage(1); setSearch(q.trim()); };

  return (
    <div>
      <div className="d-flex align-items-center justify-content-between flex-wrap gap-2 mb-3">
        <h1 className="h4 mb-0">Utilisateurs</h1>
        <button className="btn btn-primary btn-sm" onClick={() => setEditing({ user: null })}>
          <i className="bi bi-plus-lg me-1" /> Nouvel utilisateur
        </button>
      </div>

      <form className="input-group input-group-sm mb-3" style={{ maxWidth: 320 }} onSubmit={submitSearch}>
        <input className="form-control" placeholder="Rechercher…" value={q}
               onChange={(e) => setQ(e.target.value)} />
        <button className="btn btn-outline-secondary" type="submit"><i className="bi bi-search" /></button>
      </form>

      <div className="card border-0 shadow-sm">
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0">
            <thead className="table-light">
              <tr>
                <th>Utilisateur</th><th>Email</th><th>Rôles</th>
                <th>Statut</th><th>Dernière connexion</th>
                <th className="text-end" style={{ width: 110 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="6" className="text-center text-secondary py-5">
                  <span className="spinner-border spinner-border-sm me-2" /> Chargement…</td></tr>
              ) : items.length === 0 ? (
                <tr><td colSpan="6" className="text-center text-secondary py-5">Aucun utilisateur.</td></tr>
              ) : (
                items.map((u) => (
                  <tr key={u.id}>
                    <td className="fw-medium">{fullName(u)}</td>
                    <td className="text-secondary">{u.email}</td>
                    <td>
                      {u.is_superadmin && <span className="badge text-bg-warning me-1">super-admin</span>}
                      {u.roles.map((r) => <span key={r} className="badge text-bg-secondary me-1">{r}</span>)}
                      {!u.is_superadmin && u.roles.length === 0 && <span className="text-secondary">—</span>}
                    </td>
                    <td>
                      {u.is_active
                        ? <span className="badge text-bg-success">actif</span>
                        : <span className="badge text-bg-secondary">inactif</span>}
                    </td>
                    <td className="text-secondary small">
                      {u.last_login_at ? new Date(u.last_login_at).toLocaleString("fr-FR") : "jamais"}
                    </td>
                    <td className="text-end">
                      <div className="btn-group btn-group-sm">
                        <button className="btn btn-outline-secondary"
                                onClick={() => setEditing({ user: u })} title="Modifier">
                          <i className="bi bi-pencil" />
                        </button>
                        <button className="btn btn-outline-danger" onClick={() => del(u)} title="Supprimer">
                          <i className="bi bi-trash" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {meta && meta.pages > 1 && (
        <nav className="d-flex align-items-center justify-content-between mt-3">
          <span className="text-secondary small">{meta.total} utilisateur(s) · page {meta.page}/{meta.pages}</span>
          <div className="btn-group btn-group-sm">
            <button className="btn btn-outline-secondary" disabled={!meta.has_prev}
                    onClick={() => setPage((p) => p - 1)}><i className="bi bi-chevron-left" /></button>
            <button className="btn btn-outline-secondary" disabled={!meta.has_next}
                    onClick={() => setPage((p) => p + 1)}><i className="bi bi-chevron-right" /></button>
          </div>
        </nav>
      )}

      {editing && (
        <UserForm user={editing.user} roles={roles}
                  onClose={() => setEditing(null)} onSaved={onSaved} />
      )}
    </div>
  );
}
