import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

import { MediaAPI, errMsg } from "../api/client";
import { useToast } from "../contexts/ToastContext";

const PER_PAGE = 18;

// Modal that lets a form field pick (or upload) an image from the media library.
// Returns the chosen media's public URL through onSelect.
export function MediaPicker({ onClose, onSelect }) {
  const { push } = useToast();
  const inputRef = useRef(null);
  const [items, setItems] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [q, setQ] = useState("");
  const [search, setSearch] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, per_page: PER_PAGE, kind: "image" };
      if (search) params.q = search;
      const data = await MediaAPI.list(params);
      setItems(data.items || []);
      setMeta(data.meta || null);
    } catch (err) {
      push(errMsg(err, "Chargement impossible"), "error");
    } finally {
      setLoading(false);
    }
  }, [page, search, push]);

  useEffect(() => { load(); }, [load]);

  const upload = async (files) => {
    const file = files?.[0];
    if (!file) return;
    setBusy(true);
    try {
      const media = await MediaAPI.upload(file);
      push("Importé");
      onSelect(media.url);          // pick the freshly uploaded file straight away
    } catch (err) {
      push(errMsg(err, "Import impossible"), "error");
    } finally {
      setBusy(false);
    }
  };

  const submitSearch = (e) => { e.preventDefault(); setPage(1); setSearch(q.trim()); };

  // Rendered through a portal so the picker (and its own <form>) never nests
  // inside the host ResourceForm's <form>.
  return createPortal(
    <>
      <div className="modal d-block" tabIndex="-1" style={{ zIndex: 1080 }}>
        <div className="modal-dialog modal-lg modal-dialog-scrollable">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">Médiathèque</h5>
              <button type="button" className="btn-close" onClick={onClose} />
            </div>
            <div className="modal-body">
              <div className="d-flex align-items-center gap-2 mb-3">
                <form className="input-group input-group-sm" style={{ maxWidth: 280 }} onSubmit={submitSearch}>
                  <input className="form-control" placeholder="Rechercher…" value={q}
                         onChange={(e) => setQ(e.target.value)} />
                  <button className="btn btn-outline-secondary" type="submit"><i className="bi bi-search" /></button>
                </form>
                <button className="btn btn-primary btn-sm ms-auto" disabled={busy}
                        onClick={() => inputRef.current?.click()}>
                  <i className="bi bi-upload me-1" /> Importer
                </button>
                <input ref={inputRef} type="file" accept="image/*" hidden
                       onChange={(e) => { upload(e.target.files); e.target.value = ""; }} />
              </div>

              {loading ? (
                <div className="text-center text-secondary py-5">
                  <span className="spinner-border spinner-border-sm me-2" /> Chargement…
                </div>
              ) : items.length === 0 ? (
                <div className="text-center text-secondary py-5">Aucune image. Importez-en une.</div>
              ) : (
                <div className="row g-2">
                  {items.map((m) => (
                    <div className="col-4 col-md-3" key={m.id}>
                      <button type="button" className="mv-picker-tile"
                              onClick={() => onSelect(m.url)} title={m.original_filename}>
                        <img src={m.thumbnail_url || m.url} alt={m.alt || m.original_filename} loading="lazy" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            {meta && meta.pages > 1 && (
              <div className="modal-footer justify-content-between">
                <span className="text-secondary small">page {meta.page}/{meta.pages}</span>
                <div className="btn-group btn-group-sm">
                  <button className="btn btn-outline-secondary" disabled={!meta.has_prev}
                          onClick={() => setPage((p) => p - 1)}><i className="bi bi-chevron-left" /></button>
                  <button className="btn btn-outline-secondary" disabled={!meta.has_next}
                          onClick={() => setPage((p) => p + 1)}><i className="bi bi-chevron-right" /></button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      <div className="modal-backdrop show" style={{ zIndex: 1070 }} />
    </>,
    document.body
  );
}
