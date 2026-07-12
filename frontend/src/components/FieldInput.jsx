import { useState } from "react";

import { MediaPicker } from "./MediaPicker";
import { RichTextEditor } from "./RichTextEditor";

// Single image field: URL input + thumbnail preview + "Choisir" / clear.
export function MediaField({ value, onChange, error }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <div className="input-group">
        {value && (
          <span className="input-group-text p-1">
            <img src={value} alt="" style={{ height: 30, width: 30, objectFit: "cover", borderRadius: 4 }} />
          </span>
        )}
        <input type="text" className={"form-control" + (error ? " is-invalid" : "")}
               placeholder="URL de l'image" value={value || ""}
               onChange={(e) => onChange(e.target.value)} />
        <button type="button" className="btn btn-outline-secondary" onClick={() => setOpen(true)}>
          <i className="bi bi-images me-1" /> Choisir
        </button>
        {value && (
          <button type="button" className="btn btn-outline-secondary" onClick={() => onChange("")}
                  title="Retirer"><i className="bi bi-x-lg" /></button>
        )}
      </div>
      {open && (
        <MediaPicker onClose={() => setOpen(false)}
                     onSelect={(url) => { onChange(url); setOpen(false); }} />
      )}
    </>
  );
}

// A reorderable list of images (for gallery-type blocks).
function MediaListField({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const list = Array.isArray(value) ? value : [];
  const removeAt = (i) => onChange(list.filter((_, j) => j !== i));
  const move = (i, d) => {
    const j = i + d;
    if (j < 0 || j >= list.length) return;
    const next = [...list];
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
  };
  return (
    <>
      <div className="d-flex flex-wrap gap-2 mb-2">
        {list.map((url, i) => (
          <div key={i} className="mv-media-list-item">
            <img src={url} alt="" />
            <div className="mv-media-list-actions">
              <button type="button" onClick={() => move(i, -1)} title="Reculer"><i className="bi bi-arrow-left" /></button>
              <button type="button" onClick={() => move(i, 1)} title="Avancer"><i className="bi bi-arrow-right" /></button>
              <button type="button" onClick={() => removeAt(i)} title="Retirer"><i className="bi bi-x-lg" /></button>
            </div>
          </div>
        ))}
        <button type="button" className="mv-media-list-add" onClick={() => setOpen(true)}>
          <i className="bi bi-plus-lg" />
        </button>
      </div>
      {open && (
        <MediaPicker onClose={() => setOpen(false)}
                     onSelect={(url) => { onChange([...list, url]); setOpen(false); }} />
      )}
    </>
  );
}

// Renders a single form control from a field descriptor. The single source of
// truth for both resource forms and the page-builder block editor.
//
// field.type: text | textarea | number | bool | select | datetime | tags | media | media-list
export function FieldInput({ f, value, onChange, error }) {
  const cls = "form-control" + (error ? " is-invalid" : "");
  switch (f.type) {
    case "media":
      return <MediaField value={value} onChange={onChange} error={error} />;
    case "media-list":
      return <MediaListField value={value} onChange={onChange} />;
    case "richtext":
      return <RichTextEditor value={value} onChange={onChange} />;
    case "textarea":
      return <textarea className={cls} rows={f.rows || 3} value={value || ""}
                       onChange={(e) => onChange(e.target.value)} />;
    case "bool":
      return (
        <div className="form-check">
          <input className="form-check-input" type="checkbox" id={f.name}
                 checked={!!value} onChange={(e) => onChange(e.target.checked)} />
          <label className="form-check-label small" htmlFor={f.name}>{f.label}</label>
        </div>
      );
    case "number":
      return <input type="number" className={cls} value={value ?? ""}
                    onChange={(e) => onChange(e.target.value)} />;
    case "datetime":
      return <input type="datetime-local" className={cls} value={value || ""}
                    onChange={(e) => onChange(e.target.value)} />;
    case "date":
      return <input type="date" className={cls} value={value || ""}
                    onChange={(e) => onChange(e.target.value)} />;
    case "select":
      return (
        <select className={"form-select" + (error ? " is-invalid" : "")} value={value || ""}
                onChange={(e) => onChange(e.target.value)}>
          {f.options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
      );
    case "color":
      return (
        <div className="input-group" style={{ maxWidth: 220 }}>
          <input type="color" className="form-control form-control-color"
                 value={/^#[0-9a-fA-F]{6}$/.test(value || "") ? value : "#000000"}
                 onChange={(e) => onChange(e.target.value)} title="Choisir une couleur" />
          <input type="text" className={cls} placeholder="#000000" value={value || ""}
                 onChange={(e) => onChange(e.target.value)} />
        </div>
      );
    default:
      return <input type="text" className={cls} value={value || ""}
                    onChange={(e) => onChange(e.target.value)} />;
  }
}

// Full labelled field group (label + control + error), used by resource forms.
export function LabelledField({ f, value, onChange, error }) {
  return (
    <div className="mb-3">
      {f.type !== "bool" && (
        <label className="form-label small">{f.label}{f.required && " *"}</label>
      )}
      <FieldInput f={f} value={value} onChange={onChange} error={error} />
      {error && (
        <div className="invalid-feedback d-block">
          {Array.isArray(error) ? error.join(", ") : String(error)}
        </div>
      )}
    </div>
  );
}
