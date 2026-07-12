import { useCallback, useEffect, useState } from "react";

import { resource, errMsg } from "../api/client";
import { useToast } from "../contexts/ToastContext";

const api = resource("menus");

// ── Immutable tree helpers (path = array of sibling indices) ─────────
const emptyNode = () => ({ label: "", url: "", children: [] });

function updateAt(nodes, path, fn) {
  const [i, ...rest] = path;
  return nodes.map((n, idx) => {
    if (idx !== i) return n;
    if (rest.length === 0) return fn(n);
    return { ...n, children: updateAt(n.children || [], rest, fn) };
  });
}

function removeAt(nodes, path) {
  const [i, ...rest] = path;
  if (rest.length === 0) return nodes.filter((_, idx) => idx !== i);
  return nodes.map((n, idx) =>
    idx === i ? { ...n, children: removeAt(n.children || [], rest) } : n);
}

function addChildAt(nodes, path) {
  if (path.length === 0) return [...nodes, emptyNode()];
  const [i, ...rest] = path;
  return nodes.map((n, idx) =>
    idx === i ? { ...n, children: addChildAt(n.children || [], rest) } : n);
}

function moveAt(nodes, path, dir) {
  const parentPath = path.slice(0, -1);
  const i = path[path.length - 1];
  const swap = (list) => {
    const j = i + dir;
    if (j < 0 || j >= list.length) return list;
    const next = [...list];
    [next[i], next[j]] = [next[j], next[i]];
    return next;
  };
  if (parentPath.length === 0) return swap(nodes);
  return updateAt(nodes, parentPath, (n) => ({ ...n, children: swap(n.children || []) }));
}

// ── Recursive node editor ───────────────────────────────────────────
function MenuNode({ node, path, siblingCount, onChange, onAdd, onRemove, onMove }) {
  return (
    <div className="mv-menu-node">
      <div className="d-flex align-items-center gap-2 mb-2">
        <i className="bi bi-grip-vertical text-secondary" />
        <input type="text" className="form-control form-control-sm" placeholder="Libellé"
               value={node.label} onChange={(e) => onChange(path, (n) => ({ ...n, label: e.target.value }))} />
        <input type="text" className="form-control form-control-sm" placeholder="/lien ou https://…"
               value={node.url} onChange={(e) => onChange(path, (n) => ({ ...n, url: e.target.value }))} />
        <div className="btn-group btn-group-sm flex-shrink-0">
          <button type="button" className="btn btn-outline-secondary" disabled={path[path.length - 1] === 0}
                  onClick={() => onMove(path, -1)} title="Monter"><i className="bi bi-arrow-up" /></button>
          <button type="button" className="btn btn-outline-secondary"
                  disabled={path[path.length - 1] === siblingCount - 1}
                  onClick={() => onMove(path, 1)} title="Descendre"><i className="bi bi-arrow-down" /></button>
          <button type="button" className="btn btn-outline-secondary"
                  onClick={() => onAdd(path)} title="Ajouter un sous-lien"><i className="bi bi-plus-lg" /></button>
          <button type="button" className="btn btn-outline-danger"
                  onClick={() => onRemove(path)} title="Supprimer"><i className="bi bi-trash" /></button>
        </div>
      </div>
      {(node.children || []).length > 0 && (
        <div className="mv-menu-children">
          {node.children.map((child, idx) => (
            <MenuNode key={idx} node={child} path={[...path, idx]}
                      siblingCount={node.children.length}
                      onChange={onChange} onAdd={onAdd} onRemove={onRemove} onMove={onMove} />
          ))}
        </div>
      )}
    </div>
  );
}

// ── Menu editor (create / edit one menu) ────────────────────────────
function MenuEditor({ menu, onBack, onSaved }) {
  const { push } = useToast();
  const isNew = !menu?.id;
  const [name, setName] = useState(menu?.name || "");
  const [location, setLocation] = useState(menu?.location || "");
  const [items, setItems] = useState(menu?.items || []);
  const [busy, setBusy] = useState(false);

  const onChange = (path, fn) => setItems((it) => updateAt(it, path, fn));
  const onRemove = (path) => setItems((it) => removeAt(it, path));
  const onAdd = (path) => setItems((it) => addChildAt(it, path));
  const onMove = (path, dir) => setItems((it) => moveAt(it, path, dir));
  const addRoot = () => setItems((it) => [...it, emptyNode()]);

  const save = async () => {
    setBusy(true);
    try {
      const payload = { name, location, items };
      const saved = isNew ? await api.create(payload) : await api.update(menu.id, payload);
      push(isNew ? "Menu créé" : "Menu enregistré");
      onSaved(saved);
    } catch (err) {
      push(errMsg(err, "Enregistrement impossible"), "error");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <div className="d-flex align-items-center justify-content-between flex-wrap gap-2 mb-3">
        <div className="d-flex align-items-center gap-2">
          <button className="btn btn-outline-secondary btn-sm" onClick={onBack}><i className="bi bi-arrow-left" /></button>
          <h1 className="h4 mb-0">{isNew ? "Nouveau menu" : name || "Menu"}</h1>
        </div>
        <button className="btn btn-primary btn-sm" onClick={save} disabled={busy || !name}>
          <i className="bi bi-check-lg me-1" /> {busy ? "…" : "Enregistrer"}
        </button>
      </div>

      <div className="card border-0 shadow-sm mb-3"><div className="card-body">
        <div className="row g-2">
          <div className="col-md-6 mb-2">
            <label className="form-label small">Nom du menu *</label>
            <input type="text" className="form-control" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="col-md-6 mb-2">
            <label className="form-label small">Emplacement</label>
            <input type="text" className="form-control" placeholder="header, footer…"
                   value={location} onChange={(e) => setLocation(e.target.value)} />
          </div>
        </div>
      </div></div>

      <div className="card border-0 shadow-sm"><div className="card-body">
        <div className="d-flex align-items-center justify-content-between mb-3">
          <span className="fw-medium">Liens</span>
          <button className="btn btn-outline-primary btn-sm" onClick={addRoot}>
            <i className="bi bi-plus-lg me-1" /> Ajouter un lien
          </button>
        </div>
        {items.length === 0 ? (
          <div className="text-center text-secondary py-4">Aucun lien. Ajoutez-en un.</div>
        ) : (
          items.map((node, idx) => (
            <MenuNode key={idx} node={node} path={[idx]} siblingCount={items.length}
                      onChange={onChange} onAdd={onAdd} onRemove={onRemove} onMove={onMove} />
          ))
        )}
      </div></div>
    </div>
  );
}

// ── Menus list ──────────────────────────────────────────────────────
function countLinks(items) {
  return (items || []).reduce((n, it) => n + 1 + countLinks(it.children), 0);
}

export function Menus() {
  const { push } = useToast();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null); // menu object | { } for new | null

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.list({ per_page: 100 });
      setItems(data.items || []);
    } catch (err) {
      push(errMsg(err, "Chargement impossible"), "error");
    } finally {
      setLoading(false);
    }
  }, [push]);

  useEffect(() => { load(); }, [load]);

  const del = async (m) => {
    if (!window.confirm(`Supprimer le menu « ${m.name} » ?`)) return;
    try {
      await api.remove(m.id);
      push("Menu supprimé");
      load();
    } catch (err) {
      push(errMsg(err, "Suppression impossible"), "error");
    }
  };

  if (editing !== null) {
    return <MenuEditor menu={editing}
                       onBack={() => setEditing(null)}
                       onSaved={() => { setEditing(null); load(); }} />;
  }

  return (
    <div>
      <div className="d-flex align-items-center justify-content-between flex-wrap gap-2 mb-3">
        <h1 className="h4 mb-0">Menus</h1>
        <button className="btn btn-primary btn-sm" onClick={() => setEditing({})}>
          <i className="bi bi-plus-lg me-1" /> Nouveau menu
        </button>
      </div>

      <div className="card border-0 shadow-sm">
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0">
            <thead className="table-light">
              <tr><th>Nom</th><th>Emplacement</th><th>Liens</th>
                <th className="text-end" style={{ width: 110 }}>Actions</th></tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="4" className="text-center text-secondary py-5">
                  <span className="spinner-border spinner-border-sm me-2" /> Chargement…</td></tr>
              ) : items.length === 0 ? (
                <tr><td colSpan="4" className="text-center text-secondary py-5">Aucun menu.</td></tr>
              ) : (
                items.map((m) => (
                  <tr key={m.id}>
                    <td className="fw-medium" role="button" onClick={() => setEditing(m)}>{m.name}</td>
                    <td className="text-secondary">{m.location
                      ? <code>{m.location}</code> : "—"}</td>
                    <td className="text-secondary">{countLinks(m.items)}</td>
                    <td className="text-end">
                      <div className="btn-group btn-group-sm">
                        <button className="btn btn-outline-secondary" onClick={() => setEditing(m)} title="Éditer">
                          <i className="bi bi-pencil" />
                        </button>
                        <button className="btn btn-outline-danger" onClick={() => del(m)} title="Supprimer">
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
    </div>
  );
}
