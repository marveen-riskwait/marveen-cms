// Global theme tokens — stored as public settings (theme_*) and applied to the
// public site (and the admin preview) as CSS variables. One place to restyle
// the whole site: colours, fonts, roundness, buttons, width.

export const FONTS = [
  ["System", "Système (rapide)"],
  ["Inter", "Inter"],
  ["Poppins", "Poppins"],
  ["Montserrat", "Montserrat"],
  ["Roboto", "Roboto"],
  ["Open Sans", "Open Sans"],
  ["Playfair Display", "Playfair Display (élégant)"],
  ["Lora", "Lora (serif)"],
];

const SERIF = new Set(["Playfair Display", "Lora"]);

// CSS font-family stack for a chosen font name.
export function fontStack(name) {
  if (!name || name === "System")
    return "system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";
  return `'${name}', ${SERIF.has(name) ? "serif" : "sans-serif"}`;
}

// Google Fonts stylesheet URL for the chosen fonts (skips System).
export function googleFontsHref(names) {
  const families = [...new Set(names)]
    .filter((n) => n && n !== "System")
    .map((n) => `family=${n.replace(/ /g, "+")}:wght@400;600;700`);
  return families.length
    ? `https://fonts.googleapis.com/css2?${families.join("&")}&display=swap`
    : null;
}

export const BUTTON_STYLES = [["pill", "Arrondi (pilule)"], ["rounded", "Coins arrondis"], ["square", "Carré"]];

// The editable theme fields (key = public setting key).
export const THEME_FIELDS = [
  { key: "theme_color_primary", label: "Couleur principale", type: "color", default: "#2f9e63" },
  { key: "theme_color_secondary", label: "Couleur secondaire", type: "color", default: "#29abe2" },
  { key: "theme_color_accent", label: "Couleur d'accent", type: "color", default: "#f59e0b" },
  { key: "theme_color_bg", label: "Fond de page", type: "color", default: "#ffffff" },
  { key: "theme_color_text", label: "Couleur du texte", type: "color", default: "#16181d" },
  { key: "theme_font_heading", label: "Police des titres", type: "font", default: "Poppins" },
  { key: "theme_font_body", label: "Police du texte", type: "font", default: "Inter" },
  { key: "theme_radius", label: "Arrondi (px)", type: "range", min: 0, max: 28, default: "14" },
  { key: "theme_button_style", label: "Style des boutons", type: "select", options: BUTTON_STYLES, default: "pill" },
  { key: "theme_container", label: "Largeur du contenu (px)", type: "range", min: 900, max: 1400, default: "1120" },
];

export const THEME_DEFAULTS = Object.fromEntries(THEME_FIELDS.map((f) => [f.key, f.default]));

// Radius (px) for buttons given the chosen style.
export function buttonRadius(style, radius) {
  if (style === "pill") return "999px";
  if (style === "square") return "0px";
  return `${radius || 12}px`;
}
