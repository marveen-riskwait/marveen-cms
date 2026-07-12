import { useCallback, useEffect, useRef, useState } from "react";

import { MediaAPI, errMsg } from "../api/client";
import { useToast } from "../contexts/ToastContext";

const PER_PAGE = 24;
const KINDS = [
  ["", "Tous les types"], ["image", "Images"],
  ["document", "Documents"], ["video", "Vidéos"], ["other", "Autres"],
];

// Human-readable file size.
function humanSize(bytes) {
  if (!bytes) return "—";
  const u = ["o", "Ko", "Mo", "Go"];
  let i = 0, n = bytes;
  while (n >= 1024 && i < u.length - 1) { n /= 1024; i++; }
  return `${n.toFixed(n < 10 && i > 0 ? 1 : 0)} ${u[i]}`;
}

function kindIcon(kind) {
  return { image: "bi-image", document: "bi-file-earmark-pdf",
           video: "bi-film" }[kind] || "bi-file-earmark";
}

function MediaCard({ item, onCopy, onDelete }) {
  const isImage = item.kind === "image" && (item.thumbnail_url || item.url);
  return (
    <div className="col-6 col-md-4 col-lg-3 col-xl-2">
      <div className="card border-0 shadow-sm h-100">
        <div className="mv-media-thumb">
          {isImage ? (
            <img src={item.thumbnail_url || item.url} alt={item.alt || item.original_filename}
                 loading="lazy" />
          ) : (
            <i className={`bi ${kindIcon(item.kind)}`} />
          )}
        </div>
        <div className="card-body p-2">
          <div className="small text-truncate fw-medium" title={item.original_filename}>
            {item.title || item.original_filename}
          </div>
          <div className="text-secondary" style={{ fontSize: ".72rem" }}>
            {humanSize(item.size_bytes)}
            {item.width ? ` · ${item.width}×${item.height}` : ""}
          </div>
        </div>
        <div className="card-footer bg-transparent border-0 p-2 pt-0 d-flex gap-1">
          <button className="btn btn-outline-secondary btn-sm flex-grow-1"
                  onClick={() => onCopy(item)} title="Copier l'URL">
            <i className="bi bi-clipboard" />
          </button>
          <a className="btn btn-outline-secondary btn-sm" href={item.url} target="_blank"
             rel="noreferrer" title="Ouvrir">
            <i className="bi bi-box-arrow-up-right" />
          </a>
          <button className="btn btn-outline-danger btn-sm"
                  onClick={() => onDelete(item)} title="Supprimer">
            <i className="bi bi-trash" />
          </button>
        </div>
      </div>
    </div>
  );
}

export function MediaLibrary() {
  const { push } = useToast();
  const inputRef = useRef(null);
  const [items, setItems] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [q, setQ] = useState("");
  const [search, setSearch] = useState("");
  const [kind, setKind] = useState("");
  const [dragging, setDragging] = useState(false);
  const [uploads, setUploads] = useState([]); // [{name, pct, error}]

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, per_page: PER_PAGE };
      if (search) params.q = search;
      if (kind) params.kind = kind;
      const data = await MediaAPI.list(params);
      setItems(data.items || []);
      setMeta(data.meta || null);
    } catch (err) {
      push(errMsg(err, "Chargement impossible"), "error");
    } finally {
      setLoading(false);
    }
  }, [page, search, kind, push]);

  useEffect(() => { load(); }, [load]);

  const uploadFiles = async (files) => {
    const list = Array.from(files);
    if (!list.length) return;
    setUploads(list.map((f) => ({ name: f.name, pct: 0 })));
    let done = 0;
    for (let i = 0; i < list.length; i++) {
      try {
        await MediaAPI.upload(list[i], {}, (pct) =>
          setUploads((u) => u.map((x, j) => (j === i ? { ...x, pct } : x))));
        done++;
      } catch (err) {
        setUploads((u) => u.map((x, j) =>
          (j === i ? { ...x, error: errMsg(err, "Échec") } : x)));
      }
    }
    if (done) push(`${done} fichier${done > 1 ? "s" : ""} importé${done > 1 ? "s" : ""}`);
    setTimeout(() => setUploads([]), 1500);
    setPage(1);
    load();
  };

  const onDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    if (e.dataTransfer.files?.length) uploadFiles(e.dataTransfer.files);
  };

  const copy = async (item) => {
    const url = window.location.origin + item.url;
    try {
      await navigator.clipboard.writeText(url);
      push("URL copiée");
    } catch {
      push(url, "success");
    }
  };

  const del = async (item) => {
    if (!window.confirm(`Supprimer « ${item.original_filename} » ?`)) return;
    try {
      await MediaAPI.remove(item.id);
      push("Déplacé dans la corbeille");
      if (items.length === 1 && page > 1) setPage((p) => p - 1);
      else load();
    } catch (err) {
      push(errMsg(err, "Suppression impossible"), "error");
    }
  };

  const submitSearch = (e) => { e.preventDefault(); setPage(1); setSearch(q.trim()); };

  return (
    <div>
      <div className="d-flex align-items-center justify-content-between flex-wrap gap-2 mb-3">
        <h1 className="h4 mb-0">Médiathèque</h1>
        <button className="btn btn-primary btn-sm" onClick={() => inputRef.current?.click()}>
          <i className="bi bi-upload me-1" /> Importer
        </button>
        <input ref={inputRef} type="file" multiple hidden
               onChange={(e) => { uploadFiles(e.target.files); e.target.value = ""; }} />
      </div>

      <div className={`mv-dropzone mb-3 ${dragging ? "is-dragging" : ""}`}
           onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
           onDragLeave={() => setDragging(false)}
           onDrop={onDrop}
           onClick={() => inputRef.current?.click()}>
        <i className="bi bi-cloud-arrow-up fs-3" />
        <div>Glissez vos fichiers ici, ou cliquez pour parcourir</div>
        <div className="small text-secondary">Images (converties en WebP), PDF, vidéos…</div>
      </div>

      {uploads.length > 0 && (
        <div className="mb-3">
          {uploads.map((u, i) => (
            <div key={i} className="small mb-1">
              <div className="d-flex justify-content-between">
                <span className="text-truncate">{u.name}</span>
                <span className={u.error ? "text-danger" : "text-secondary"}>
                  {u.error || `${u.pct}%`}</span>
              </div>
              {!u.error && (
                <div className="progress" style={{ height: 4 }}>
                  <div className="progress-bar" style={{ width: `${u.pct}%` }} />
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="d-flex align-items-center flex-wrap gap-2 mb-3">
        <form className="input-group input-group-sm" style={{ maxWidth: 320 }} onSubmit={submitSearch}>
          <input className="form-control" placeholder="Rechercher…" value={q}
                 onChange={(e) => setQ(e.target.value)} />
          <button className="btn btn-outline-secondary" type="submit"><i className="bi bi-search" /></button>
        </form>
        <select className="form-select form-select-sm" style={{ maxWidth: 200 }}
                value={kind} onChange={(e) => { setPage(1); setKind(e.target.value); }}>
          {KINDS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="text-center text-secondary py-5">
          <span className="spinner-border spinner-border-sm me-2" /> Chargement…
        </div>
      ) : items.length === 0 ? (
        <div className="text-center text-secondary py-5">Aucun média.</div>
      ) : (
        <div className="row g-3">
          {items.map((m) => (
            <MediaCard key={m.id} item={m} onCopy={copy} onDelete={del} />
          ))}
        </div>
      )}

      {meta && meta.pages > 1 && (
        <nav className="d-flex align-items-center justify-content-between mt-3">
          <span className="text-secondary small">
            {meta.total} média{meta.total > 1 ? "s" : ""} · page {meta.page}/{meta.pages}
          </span>
          <div className="btn-group btn-group-sm">
            <button className="btn btn-outline-secondary" disabled={!meta.has_prev}
                    onClick={() => setPage((p) => p - 1)}><i className="bi bi-chevron-left" /></button>
            <button className="btn btn-outline-secondary" disabled={!meta.has_next}
                    onClick={() => setPage((p) => p + 1)}><i className="bi bi-chevron-right" /></button>
          </div>
        </nav>
      )}
    </div>
  );
}
