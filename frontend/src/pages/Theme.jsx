import { useEffect, useMemo, useState } from "react";

import { SettingsAPI, errMsg } from "../api/client";
import {
  BUTTON_STYLES, FONTS, THEME_DEFAULTS, THEME_FIELDS,
  buttonRadius, fontStack, googleFontsHref,
} from "../config/theme";
import { useToast } from "../contexts/ToastContext";

// Inject a Google Fonts stylesheet so the preview shows the real fonts.
function useFontLink(names) {
  useEffect(() => {
    const href = googleFontsHref(names);
    if (!href) return;
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = href;
    document.head.appendChild(link);
    return () => { document.head.removeChild(link); };
  }, [names.join("|")]); // eslint-disable-line react-hooks/exhaustive-deps
}

function Field({ f, value, onChange }) {
  if (f.type === "color") {
    return (
      <div className="d-flex align-items-center gap-2">
        <input type="color" className="form-control form-control-color"
               value={/^#[0-9a-fA-F]{6}$/.test(value) ? value : "#000000"}
               onChange={(e) => onChange(e.target.value)} />
        <input type="text" className="form-control form-control-sm" style={{ maxWidth: 110 }}
               value={value} onChange={(e) => onChange(e.target.value)} />
      </div>
    );
  }
  if (f.type === "font") {
    return (
      <select className="form-select form-select-sm" value={value} onChange={(e) => onChange(e.target.value)}>
        {FONTS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
      </select>
    );
  }
  if (f.type === "range") {
    return (
      <div className="d-flex align-items-center gap-2">
        <input type="range" className="form-range" min={f.min} max={f.max}
               value={value} onChange={(e) => onChange(e.target.value)} />
        <span className="small text-secondary" style={{ width: 44 }}>{value}px</span>
      </div>
    );
  }
  return (
    <select className="form-select form-select-sm" value={value} onChange={(e) => onChange(e.target.value)}>
      {f.options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
    </select>
  );
}

export function Theme() {
  const { push } = useToast();
  const [values, setValues] = useState(THEME_DEFAULTS);
  const [initial, setInitial] = useState(THEME_DEFAULTS);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    SettingsAPI.getAll()
      .then(({ map }) => {
        const next = { ...THEME_DEFAULTS };
        for (const f of THEME_FIELDS) if (map?.[f.key] != null) next[f.key] = String(map[f.key]);
        setValues(next); setInitial(next);
      })
      .catch((err) => push(errMsg(err, "Chargement impossible"), "error"))
      .finally(() => setLoading(false));
  }, [push]);

  useFontLink([values.theme_font_heading, values.theme_font_body]);

  const set = (k, v) => setValues((s) => ({ ...s, [k]: v }));
  const dirty = useMemo(
    () => THEME_FIELDS.filter((f) => values[f.key] !== initial[f.key]).map((f) => f.key),
    [values, initial]);

  const save = async () => {
    setBusy(true);
    try {
      for (const key of dirty) await SettingsAPI.put(key, values[key], "theme", true);
      setInitial({ ...values });
      push("Thème enregistré — rechargez le site public pour voir le rendu");
    } catch (err) {
      push(errMsg(err, "Enregistrement impossible"), "error");
    } finally { setBusy(false); }
  };

  // Live preview styles from the current selection.
  const preview = {
    background: values.theme_color_bg, color: values.theme_color_text,
    fontFamily: fontStack(values.theme_font_body),
    "--r": `${values.theme_radius}px`,
  };
  const btn = (bg) => ({
    background: bg, color: "#fff", border: 0, padding: ".7rem 1.4rem", fontWeight: 700,
    borderRadius: buttonRadius(values.theme_button_style, values.theme_radius), cursor: "pointer",
  });

  if (loading) return <div className="text-center text-secondary py-5"><span className="spinner-border spinner-border-sm me-2" />Chargement…</div>;

  return (
    <div>
      <div className="d-flex align-items-center justify-content-between flex-wrap gap-2 mb-1">
        <h1 className="h4 mb-0"><i className="bi bi-palette me-2 text-secondary" />Apparence du site</h1>
        <button className="btn btn-primary btn-sm" onClick={save} disabled={busy || dirty.length === 0}>
          <i className="bi bi-check-lg me-1" />{busy ? "…" : dirty.length ? `Enregistrer (${dirty.length})` : "Enregistré"}
        </button>
      </div>
      <p className="text-secondary small mb-4">Ces réglages habillent tout ton site public.</p>

      <div className="row g-4">
        <div className="col-lg-6">
          <div className="card border-0 shadow-sm"><div className="card-body">
            {THEME_FIELDS.map((f) => (
              <div className="row align-items-center mb-3" key={f.key}>
                <label className="col-5 col-form-label col-form-label-sm">{f.label}</label>
                <div className="col-7"><Field f={f} value={values[f.key]} onChange={(v) => set(f.key, v)} /></div>
              </div>
            ))}
          </div></div>
        </div>

        <div className="col-lg-6">
          <div className="card border-0 shadow-sm sticky-top" style={{ top: 74 }}>
            <div className="card-header bg-transparent small fw-medium text-secondary">
              <i className="bi bi-eye me-1" />Aperçu
            </div>
            <div style={{ ...preview, padding: "1.6rem", borderRadius: "0 0 12px 12px" }}>
              <div style={{ height: 120, borderRadius: values.theme_radius + "px",
                            background: `linear-gradient(120deg, ${values.theme_color_primary}, ${values.theme_color_secondary})`,
                            display: "flex", alignItems: "center", padding: "0 1.2rem", color: "#fff",
                            fontFamily: fontStack(values.theme_font_heading), fontWeight: 800, fontSize: "1.5rem" }}>
                Roulez au lac du Salagou
              </div>
              <h2 style={{ fontFamily: fontStack(values.theme_font_heading), marginTop: "1.2rem" }}>Un titre d'exemple</h2>
              <p>Voici un paragraphe de démonstration pour visualiser la police du texte et les couleurs de ton site.</p>
              <div className="d-flex gap-2 flex-wrap">
                <button style={btn(values.theme_color_primary)}>Bouton principal</button>
                <button style={btn(values.theme_color_secondary)}>Secondaire</button>
                <button style={{ ...btn("transparent"), color: values.theme_color_text,
                                 boxShadow: `inset 0 0 0 2px ${values.theme_color_text}33` }}>Contour</button>
              </div>
              <a href="#" style={{ color: values.theme_color_primary, display: "inline-block", marginTop: "1rem", fontWeight: 600 }}>
                Un lien d'exemple →
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
