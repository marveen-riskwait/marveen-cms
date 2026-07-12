import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { ContentTypesAPI, errMsg } from "../api/client";
import { useToast } from "../contexts/ToastContext";

const FIELD_TYPES = [
  ["text", "Texte court"], ["textarea", "Texte long"], ["richtext", "Texte riche"],
  ["number", "Nombre"], ["boolean", "Oui / Non"], ["date", "Date"],
  ["media", "Image / média"], ["select", "Liste de choix"], ["relation", "Relation"],
];

const emptyField = () => ({
  key: "", label: "", field_type: "text", required: false, is_title: false, config: {},
});

// ── Field row in the builder ────────────────────────────────────────
function FieldRow({ field, types, onChange, onRemove, onTitle }) {
  const set = (k, v) => onChange({ ...field, [k]: v });
  const setOptions = (text) =>
    onChange({ ...field, config: { ...field.config,
      options: text.split("\n").map((l) => l.trim()).filter(Boolean)
        .map((l) => { const [value, label] = l.split("|"); return { value: value.trim(), label: (label || value).trim() }; }) } });
  const optionsText = (field.config?.options || [])
    .map((o) => (o.label && o.label !== o.value ? `${o.value}|${o.label}` : o.value)).join("\n");

  return (
    <div className="card border-0 shadow-sm mb-2"><div className="card-body py-2">
      <div className="row g-2 align-items-end">
        <div className="col-md-3">
          <label className="form-label small mb-0">Libellé</label>
          <input className="form-control form-control-sm" value={field.label}
                 onChange={(e) => set("label", e.target.value)} placeholder="Prix" />
        </div>
        <div className="col-md-2">
          <label className="form-label small mb-0">Clé</label>
          <input className="form-control form-control-sm" value={field.key}
                 onChange={(e) => set("key", e.target.value)} placeholder="prix" />
        </div>
        <div className="col-md-3">
          <label className="form-label small mb-0">Type</label>
          <select className="form-select form-select-sm" value={field.field_type}
                  onChange={(e) => set("field_type", e.target.value)}>
            {FIELD_TYPES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        </div>
        <div className="col-md-4 d-flex align-items-center gap-3">
          <div className="form-check">
            <input className="form-check-input" type="checkbox" checked={field.required}
                   onChange={(e) => set("required", e.target.checked)} id={`req-${field._uid}`} />
            <label className="form-check-label small" htmlFor={`req-${field._uid}`}>Requis</label>
          </div>
          <div className="form-check">
            <input className="form-check-input" type="radio" checked={field.is_title}
                   onChange={onTitle} name="titlefield" id={`title-${field._uid}`} />
            <label className="form-check-label small" htmlFor={`title-${field._uid}`}>Titre</label>
          </div>
          <button type="button" className="btn btn-outline-danger btn-sm ms-auto"
                  onClick={onRemove}><i className="bi bi-trash" /></button>
        </div>
        {field.field_type === "select" && (
          <div className="col-12">
            <label className="form-label small mb-0">Options (une par ligne, « valeur|libellé »)</label>
            <textarea className="form-control form-control-sm" rows="2" value={optionsText}
                      onChange={(e) => setOptions(e.target.value)} placeholder={"vtt|VTT\nroute|Route"} />
          </div>
        )}
        {field.field_type === "relation" && (
          <div className="col-md-4">
            <label className="form-label small mb-0">Type lié (slug)</label>
            <input className="form-control form-control-sm" value={field.config?.relation || ""}
                   onChange={(e) => onChange({ ...field, config: { ...field.config, relation: e.target.value } })}
                   placeholder="categorie" />
          </div>
        )}
      </div>
    </div></div>
  );
}

// ── Builder (create / edit a type) ──────────────────────────────────
function TypeBuilder({ type, onBack, onSaved }) {
  const { push } = useToast();
  const isNew = !type?.id;
  const [name, setName] = useState(type?.name || "");
  const [slug, setSlug] = useState(type?.slug || "");
  const [icon, setIcon] = useState(type?.icon || "bi-collection");
  const [description, setDescription] = useState(type?.description || "");
  const [fields, setFields] = useState(
    () => (type?.fields || []).map((f, i) => ({ ...f, _uid: `f${i}` })));
  const [busy, setBusy] = useState(false);

  const addField = () => setFields((fs) => [...fs, { ...emptyField(), _uid: `f${Date.now()}` }]);
  const updateField = (uid, next) => setFields((fs) => fs.map((f) => (f._uid === uid ? { ...next, _uid: uid } : f)));
  const removeField = (uid) => setFields((fs) => fs.filter((f) => f._uid !== uid));
  const setTitleField = (uid) => setFields((fs) => fs.map((f) => ({ ...f, is_title: f._uid === uid })));

  const save = async () => {
    setBusy(true);
    try {
      const payload = { name, slug, icon, description,
        fields: fields.map(({ _uid, ...f }, i) => ({ ...f, sort_order: i })) };
      const saved = isNew ? await ContentTypesAPI.create(payload)
                          : await ContentTypesAPI.update(type.id, payload);
      push(isNew ? "Type créé" : "Type enregistré");
      onSaved(saved);
    } catch (err) {
      push(errMsg(err, "Enregistrement impossible"), "error");
    } finally { setBusy(false); }
  };

  return (
    <div>
      <div className="d-flex align-items-center justify-content-between flex-wrap gap-2 mb-3">
        <div className="d-flex align-items-center gap-2">
          <button className="btn btn-outline-secondary btn-sm" onClick={onBack}><i className="bi bi-arrow-left" /></button>
          <h1 className="h4 mb-0">{isNew ? "Nouveau type de contenu" : name}</h1>
        </div>
        <button className="btn btn-primary btn-sm" onClick={save} disabled={busy || !name}>
          <i className="bi bi-check-lg me-1" /> {busy ? "…" : "Enregistrer"}
        </button>
      </div>

      <div className="card border-0 shadow-sm mb-3"><div className="card-body">
        <div className="row g-2">
          <div className="col-md-5 mb-2">
            <label className="form-label small">Nom *</label>
            <input className="form-control" value={name} onChange={(e) => setName(e.target.value)} placeholder="Vélo" />
          </div>
          <div className="col-md-4 mb-2">
            <label className="form-label small">Slug (auto si vide)</label>
            <input className="form-control" value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="velo" />
          </div>
          <div className="col-md-3 mb-2">
            <label className="form-label small">Icône (Bootstrap)</label>
            <input className="form-control" value={icon} onChange={(e) => setIcon(e.target.value)} placeholder="bi-bicycle" />
          </div>
          <div className="col-12">
            <label className="form-label small">Description</label>
            <input className="form-control" value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
        </div>
      </div></div>

      <div className="d-flex align-items-center justify-content-between mb-2">
        <span className="fw-medium">Champs</span>
        <button className="btn btn-outline-primary btn-sm" onClick={addField}>
          <i className="bi bi-plus-lg me-1" /> Ajouter un champ
        </button>
      </div>
      {fields.length === 0
        ? <div className="text-center text-secondary py-3">Aucun champ. Ajoutez-en un.</div>
        : fields.map((f) => (
            <FieldRow key={f._uid} field={f} onChange={(next) => updateField(f._uid, next)}
                      onRemove={() => removeField(f._uid)} onTitle={() => setTitleField(f._uid)} />
          ))}
    </div>
  );
}

// ── Types list ──────────────────────────────────────────────────────
export function ContentTypes() {
  const { push } = useToast();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null); // type | {} for new | null

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await ContentTypesAPI.list({ per_page: 100 });
      setItems(data.items || []);
    } catch (err) {
      push(errMsg(err, "Chargement impossible"), "error");
    } finally { setLoading(false); }
  }, [push]);

  useEffect(() => { load(); }, [load]);

  const edit = async (row) => setEditing(await ContentTypesAPI.get(row.id));

  const del = async (row) => {
    if (!window.confirm(`Supprimer le type « ${row.name} » ?`)) return;
    try { await ContentTypesAPI.remove(row.id); push("Type supprimé"); load(); }
    catch (err) { push(errMsg(err, "Suppression impossible"), "error"); }
  };

  if (editing !== null) {
    return <TypeBuilder type={editing} onBack={() => setEditing(null)}
                        onSaved={() => { setEditing(null); load(); }} />;
  }

  return (
    <div>
      <div className="d-flex align-items-center justify-content-between flex-wrap gap-2 mb-3">
        <h1 className="h4 mb-0">Types de contenu</h1>
        <button className="btn btn-primary btn-sm" onClick={() => setEditing({})}>
          <i className="bi bi-plus-lg me-1" /> Nouveau type
        </button>
      </div>

      <div className="card border-0 shadow-sm"><div className="table-responsive">
        <table className="table table-hover align-middle mb-0">
          <thead className="table-light"><tr>
            <th>Nom</th><th>Slug</th><th>Champs</th>
            <th className="text-end" style={{ width: 200 }}>Actions</th>
          </tr></thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="4" className="text-center text-secondary py-5">
                <span className="spinner-border spinner-border-sm me-2" /> Chargement…</td></tr>
            ) : items.length === 0 ? (
              <tr><td colSpan="4" className="text-center text-secondary py-5">
                Aucun type de contenu. Créez-en un pour modéliser vos données.</td></tr>
            ) : items.map((t) => (
              <tr key={t.id}>
                <td className="fw-medium"><i className={`bi ${t.icon || "bi-collection"} me-2 text-secondary`} />{t.name}</td>
                <td className="text-secondary"><code>{t.slug}</code></td>
                <td className="text-secondary">{(t.fields || []).length || "—"}</td>
                <td className="text-end">
                  <div className="btn-group btn-group-sm">
                    <Link className="btn btn-outline-primary" to={`/admin/content/${t.slug}`}>
                      <i className="bi bi-list-ul me-1" />Entrées
                    </Link>
                    <button className="btn btn-outline-secondary" onClick={() => edit(t)} title="Modifier le schéma">
                      <i className="bi bi-pencil" />
                    </button>
                    <button className="btn btn-outline-danger" onClick={() => del(t)} title="Supprimer">
                      <i className="bi bi-trash" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div></div>
    </div>
  );
}
