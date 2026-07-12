import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";

import { ContentTypesAPI, contentEntries, errMsg } from "../api/client";
import { LabelledField } from "../components/FieldInput";
import { useToast } from "../contexts/ToastContext";
import { Placeholder } from "./Placeholder";

const PER_PAGE = 20;
const STATUS = [["draft", "Brouillon"], ["published", "Publié"], ["archived", "Archivé"]];

// Map a FieldDefinition to a FieldInput descriptor.
function toDescriptor(field, relOptions) {
  const base = { name: field.key, label: field.label, required: field.required };
  switch (field.field_type) {
    case "boolean": return { ...base, type: "bool" };
    case "select":
      return { ...base, type: "select",
        options: [["", "—"], ...(field.config?.options || []).map((o) => [o.value, o.label])] };
    case "relation":
      return { ...base, type: "select", options: [["", "—"], ...(relOptions[field.key] || [])] };
    default: return { ...base, type: field.field_type };
  }
}

// ── Entry create / edit modal ───────────────────────────────────────
function EntryForm({ type, entry, api, onClose, onSaved }) {
  const { push } = useToast();
  const isEdit = !!entry;
  const [data, setData] = useState(() => ({ ...(entry?.data || {}) }));
  const [status, setStatus] = useState(entry?.status || "draft");
  const [relOptions, setRelOptions] = useState({});
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);

  // Load option lists for relation fields.
  useEffect(() => {
    const relFields = type.fields.filter((f) => f.field_type === "relation" && f.config?.relation);
    relFields.forEach((f) => {
      contentEntries(f.config.relation).list({ per_page: 100 })
        .then((d) => setRelOptions((o) => ({ ...o, [f.key]: (d.items || []).map((e) => [String(e.id), e.title || `#${e.id}`]) })))
        .catch(() => {});
    });
  }, [type]);

  const set = (key, v) => setData((d) => ({ ...d, [key]: v }));

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true); setErrors({});
    try {
      const payload = { data, status };
      if (isEdit) await api.update(entry.id, payload);
      else await api.create(payload);
      push(isEdit ? "Entrée modifiée" : "Entrée créée");
      onSaved();
    } catch (err) {
      const body = err?.response?.data;
      if (body?.errors) setErrors(body.errors);
      push(errMsg(err, "Enregistrement impossible"), "error");
    } finally { setBusy(false); }
  };

  return (
    <>
      <div className="modal d-block" tabIndex="-1">
        <div className="modal-dialog modal-lg modal-dialog-scrollable">
          <div className="modal-content"><form onSubmit={submit}>
            <div className="modal-header">
              <h5 className="modal-title">{isEdit ? "Modifier" : "Nouvelle entrée"} — {type.name}</h5>
              <button type="button" className="btn-close" onClick={onClose} />
            </div>
            <div className="modal-body">
              {type.fields.map((f) => (
                <LabelledField key={f.key} f={toDescriptor(f, relOptions)}
                               value={data[f.key]} onChange={(v) => set(f.key, v)} error={errors[f.key]} />
              ))}
              <div className="mb-2">
                <label className="form-label small">Statut</label>
                <select className="form-select" value={status} onChange={(e) => setStatus(e.target.value)}>
                  {STATUS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-outline-secondary" onClick={onClose}>Annuler</button>
              <button className="btn btn-primary" disabled={busy}>{busy ? "…" : "Enregistrer"}</button>
            </div>
          </form></div>
        </div>
      </div>
      <div className="modal-backdrop show" />
    </>
  );
}

export function ContentEntries() {
  const { slug } = useParams();
  const { push } = useToast();
  const api = useMemo(() => contentEntries(slug), [slug]);
  const [type, setType] = useState(null);
  const [notFound, setNotFound] = useState(false);
  const [items, setItems] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [q, setQ] = useState("");
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState(null); // entry | {} | null

  // Resolve the type (with fields) from its slug.
  useEffect(() => {
    let alive = true;
    ContentTypesAPI.list({ per_page: 100 })
      .then((d) => {
        const found = (d.items || []).find((t) => t.slug === slug);
        if (!found) { if (alive) setNotFound(true); return; }
        return ContentTypesAPI.get(found.id).then((full) => alive && setType(full));
      })
      .catch(() => alive && setNotFound(true));
    return () => { alive = false; };
  }, [slug]);

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
    } finally { setLoading(false); }
  }, [api, page, search, push]);

  useEffect(() => { if (type) load(); }, [type, load]);

  const del = async (row) => {
    if (!window.confirm(`Supprimer « ${row.title || `#${row.id}`} » ?`)) return;
    try {
      await api.remove(row.id);
      push("Entrée supprimée");
      if (items.length === 1 && page > 1) setPage((p) => p - 1); else load();
    } catch (err) { push(errMsg(err, "Suppression impossible"), "error"); }
  };

  const edit = async (row) => setEditing(await api.get(row.id));
  const submitSearch = (e) => { e.preventDefault(); setPage(1); setSearch(q.trim()); };

  if (notFound) return <Placeholder />;
  if (!type) return <div className="text-center text-secondary py-5"><span className="spinner-border spinner-border-sm me-2" />Chargement…</div>;

  // Show the title, up to two extra fields, then status.
  const extraCols = type.fields.filter((f) => !f.is_title).slice(0, 2);

  return (
    <div>
      <div className="d-flex align-items-center justify-content-between flex-wrap gap-2 mb-3">
        <div className="d-flex align-items-center gap-2">
          <h1 className="h4 mb-0"><i className={`bi ${type.icon || "bi-collection"} me-2 text-secondary`} />{type.name}</h1>
          <Link className="btn btn-outline-secondary btn-sm" to="/admin/content-types" title="Schéma">
            <i className="bi bi-sliders" />
          </Link>
        </div>
        <button className="btn btn-primary btn-sm" onClick={() => setEditing({})}>
          <i className="bi bi-plus-lg me-1" /> Nouvelle entrée
        </button>
      </div>

      <form className="input-group input-group-sm mb-3" style={{ maxWidth: 320 }} onSubmit={submitSearch}>
        <input className="form-control" placeholder="Rechercher…" value={q} onChange={(e) => setQ(e.target.value)} />
        <button className="btn btn-outline-secondary" type="submit"><i className="bi bi-search" /></button>
      </form>

      <div className="card border-0 shadow-sm"><div className="table-responsive">
        <table className="table table-hover align-middle mb-0">
          <thead className="table-light"><tr>
            <th>Titre</th>
            {extraCols.map((f) => <th key={f.key}>{f.label}</th>)}
            <th>Statut</th>
            <th className="text-end" style={{ width: 110 }}>Actions</th>
          </tr></thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={extraCols.length + 3} className="text-center text-secondary py-5">
                <span className="spinner-border spinner-border-sm me-2" /> Chargement…</td></tr>
            ) : items.length === 0 ? (
              <tr><td colSpan={extraCols.length + 3} className="text-center text-secondary py-5">Aucune entrée.</td></tr>
            ) : items.map((e) => (
              <tr key={e.id}>
                <td className="fw-medium">{e.title || <span className="text-secondary">#{e.id}</span>}</td>
                {extraCols.map((f) => (
                  <td key={f.key} className="text-secondary">
                    {f.field_type === "boolean"
                      ? (e.data?.[f.key] ? <i className="bi bi-check-circle-fill text-success" /> : <i className="bi bi-dash text-secondary" />)
                      : String(e.data?.[f.key] ?? "—")}
                  </td>
                ))}
                <td><span className={"badge " + (e.status === "published" ? "text-bg-success" : "text-bg-secondary")}>{e.status}</span></td>
                <td className="text-end">
                  <div className="btn-group btn-group-sm">
                    <button className="btn btn-outline-secondary" onClick={() => edit(e)} title="Modifier"><i className="bi bi-pencil" /></button>
                    <button className="btn btn-outline-danger" onClick={() => del(e)} title="Supprimer"><i className="bi bi-trash" /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div></div>

      {meta && meta.pages > 1 && (
        <nav className="d-flex align-items-center justify-content-between mt-3">
          <span className="text-secondary small">{meta.total} entrée(s) · page {meta.page}/{meta.pages}</span>
          <div className="btn-group btn-group-sm">
            <button className="btn btn-outline-secondary" disabled={!meta.has_prev} onClick={() => setPage((p) => p - 1)}><i className="bi bi-chevron-left" /></button>
            <button className="btn btn-outline-secondary" disabled={!meta.has_next} onClick={() => setPage((p) => p + 1)}><i className="bi bi-chevron-right" /></button>
          </div>
        </nav>
      )}

      {editing && (
        <EntryForm type={type} entry={editing.id ? editing : null} api={api}
                   onClose={() => setEditing(null)} onSaved={() => { setEditing(null); load(); }} />
      )}
    </div>
  );
}
