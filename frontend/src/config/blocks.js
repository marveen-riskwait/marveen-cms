// Page Builder block registry (frontend). Mirrors the block types the backend
// accepts (app/services/blocks.py). Each entry drives the block editor: the
// fields render through the shared FieldInput, and `make` builds an empty block.
//
// The strict-schema types (hero/text/image/quote/cta/video/html) must match the
// backend field names exactly; `gallery` passes through as a free-form dict.

export const BLOCK_TYPES = {
  hero: {
    label: "Bannière", icon: "bi-easel",
    fields: [
      { name: "title", label: "Titre", type: "text" },
      { name: "subtitle", label: "Sous-titre", type: "text" },
      { name: "image", label: "Image de fond", type: "media" },
      { name: "cta_label", label: "Libellé du bouton", type: "text" },
      { name: "cta_url", label: "Lien du bouton", type: "text" },
    ],
  },
  text: {
    label: "Texte", icon: "bi-text-paragraph",
    fields: [{ name: "html", label: "Contenu", type: "richtext" }],
  },
  image: {
    label: "Image", icon: "bi-image",
    fields: [
      { name: "src", label: "Image", type: "media" },
      { name: "alt", label: "Texte alternatif", type: "text" },
      { name: "caption", label: "Légende", type: "text" },
      { name: "link", label: "Lien au clic (image cliquable)", type: "link" },
      { name: "link_new_tab", label: "Ouvrir dans un nouvel onglet", type: "bool" },
    ],
  },
  gallery: {
    label: "Galerie", icon: "bi-images",
    fields: [{ name: "images", label: "Images", type: "media-list" }],
  },
  quote: {
    label: "Citation", icon: "bi-chat-quote",
    fields: [
      { name: "text", label: "Citation", type: "textarea" },
      { name: "author", label: "Auteur", type: "text" },
    ],
  },
  cta: {
    label: "Appel à l'action", icon: "bi-hand-index",
    fields: [
      { name: "label", label: "Libellé", type: "text" },
      { name: "url", label: "Lien", type: "text" },
      { name: "style", label: "Style", type: "select",
        options: [["primary", "Primaire"], ["secondary", "Secondaire"], ["outline", "Contour"]] },
    ],
  },
  video: {
    label: "Vidéo", icon: "bi-play-btn",
    fields: [
      { name: "url", label: "URL de la vidéo", type: "text" },
      { name: "provider", label: "Source", type: "select",
        options: [["file", "Fichier"], ["youtube", "YouTube"], ["vimeo", "Vimeo"]] },
    ],
  },
  html: {
    label: "HTML libre", icon: "bi-code-slash",
    fields: [{ name: "html", label: "Code HTML", type: "textarea", rows: 6 }],
  },
  map: {
    label: "Carte", icon: "bi-geo-alt",
    fields: [
      { name: "address", label: "Adresse (le pin s'y place)", type: "text" },
      { name: "title", label: "Titre (optionnel)", type: "text" },
    ],
  },
};

// Palette order in the "add block" menu.
export const BLOCK_ORDER = ["hero", "text", "image", "gallery", "quote", "cta", "video", "map", "html"];

// Build an empty block of the given type from its field defaults.
export function makeBlock(type) {
  const def = BLOCK_TYPES[type];
  const data = {};
  for (const f of def.fields)
    data[f.name] = f.type === "media-list" ? [] : f.type === "bool" ? false : "";
  return { type, data, active: true };
}

// Short human summary of a block, for the collapsed card header.
export function blockSummary(block) {
  const d = block.data || {};
  const first =
    d.title || d.text || d.label || d.caption || d.alt || d.url || d.src ||
    (Array.isArray(d.images) ? `${d.images.length} image(s)` : "") ||
    (typeof d.html === "string" ? d.html.replace(/<[^>]*>/g, "").slice(0, 60) : "");
  return first || "—";
}
