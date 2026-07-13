// Applies the CMS theme settings (theme_*) to the public site as CSS variables.
// Mirrors frontend/src/config/theme.js.

const SERIF = new Set(["Playfair Display", "Lora"]);
const DEFAULTS = {
  theme_color_primary: "#2f9e63",
  theme_color_secondary: "#29abe2",
  theme_color_accent: "#f59e0b",
  theme_color_bg: "#ffffff",
  theme_color_text: "#16181d",
  theme_font_heading: "Poppins",
  theme_font_body: "Inter",
  theme_radius: "14",
  theme_button_style: "pill",
  theme_container: "1120",
};

function fontStack(name) {
  if (!name || name === "System")
    return "system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";
  return `'${name}', ${SERIF.has(name) ? "serif" : "sans-serif"}`;
}

export function googleFontsHref(settings) {
  const s = { ...DEFAULTS, ...(settings || {}) };
  const names = [...new Set([s.theme_font_heading, s.theme_font_body])]
    .filter((n) => n && n !== "System")
    .map((n) => `family=${n.replace(/ /g, "+")}:wght@400;600;700`);
  return names.length ? `https://fonts.googleapis.com/css2?${names.join("&")}&display=swap` : null;
}

function buttonRadius(style, radius) {
  if (style === "pill") return "999px";
  if (style === "square") return "0px";
  return `${radius || 12}px`;
}

// Build the `:root { --… }` CSS overriding globals.css defaults.
export function themeCss(settings) {
  const s = { ...DEFAULTS, ...(settings || {}) };
  return `:root{
    --brand:${s.theme_color_primary};
    --brand-2:${s.theme_color_secondary};
    --accent:${s.theme_color_accent};
    --bg:${s.theme_color_bg};
    --ink:${s.theme_color_text};
    --radius:${s.theme_radius}px;
    --btn-radius:${buttonRadius(s.theme_button_style, s.theme_radius)};
    --maxw:${s.theme_container}px;
    --font-heading:${fontStack(s.theme_font_heading)};
    --font-body:${fontStack(s.theme_font_body)};
  }`;
}
