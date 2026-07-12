// Declarative description of each module's admin screen. The generic list +
// form components render entirely from this — a new module is one entry.
//
// field.type: text | textarea | number | bool | select | datetime | tags | media
// column.type: text | bool | badge

const STATUS = [
  ["draft", "Brouillon"], ["published", "Publié"],
  ["scheduled", "Programmé"], ["archived", "Archivé"],
];
const PUBLISHED_FILTER = { name: "is_published", label: "Publié", type: "bool" };
const PUBLISHED_FIELD = { name: "is_published", label: "Publié", type: "bool", default: true };
const ORDER_FIELD = { name: "sort_order", label: "Ordre", type: "number", default: 0 };

const article = (label) => ({
  label, api: null, searchable: true,
  columns: [
    { key: "title", label: "Titre" },
    { key: "category", label: "Catégorie" },
    { key: "status", label: "Statut", type: "badge" },
    { key: "is_featured", label: "À la une", type: "bool" },
  ],
  filters: [{ name: "status", label: "Statut", type: "select", options: STATUS }],
  fields: [
    { name: "title", label: "Titre", type: "text", required: true },
    { name: "excerpt", label: "Extrait", type: "textarea" },
    { name: "content", label: "Contenu (HTML)", type: "textarea" },
    { name: "cover_image", label: "Image de couverture", type: "media" },
    { name: "category", label: "Catégorie", type: "text" },
    { name: "status", label: "Statut", type: "select", options: STATUS, default: "draft" },
    { name: "is_featured", label: "À la une", type: "bool" },
    { name: "tags", label: "Tags", type: "tags" },
  ],
});

export const RESOURCES = {
  faq: {
    label: "FAQ", api: "faq", searchable: true,
    columns: [
      { key: "question", label: "Question" },
      { key: "category", label: "Catégorie" },
      { key: "is_published", label: "Publié", type: "bool" },
    ],
    filters: [PUBLISHED_FILTER],
    fields: [
      { name: "question", label: "Question", type: "text", required: true },
      { name: "answer", label: "Réponse", type: "textarea", required: true },
      { name: "category", label: "Catégorie", type: "text" },
      ORDER_FIELD, PUBLISHED_FIELD,
    ],
  },
  categories: {
    label: "Catégories", api: "categories", searchable: true,
    columns: [
      { key: "name", label: "Nom" }, { key: "slug", label: "Slug" },
      { key: "is_published", label: "Publié", type: "bool" },
    ],
    filters: [PUBLISHED_FILTER],
    fields: [
      { name: "name", label: "Nom", type: "text", required: true },
      { name: "slug", label: "Slug", type: "text" },
      { name: "description", label: "Description", type: "textarea" },
      ORDER_FIELD, PUBLISHED_FIELD,
    ],
  },
  testimonials: {
    label: "Témoignages", api: "testimonials", searchable: true,
    columns: [
      { key: "author_name", label: "Auteur" }, { key: "rating", label: "Note" },
      { key: "is_published", label: "Publié", type: "bool" },
    ],
    filters: [PUBLISHED_FILTER],
    fields: [
      { name: "author_name", label: "Auteur", type: "text", required: true },
      { name: "role", label: "Rôle / lieu", type: "text" },
      { name: "quote", label: "Témoignage", type: "textarea", required: true },
      { name: "rating", label: "Note (1-5)", type: "number", default: 5 },
      { name: "avatar", label: "Avatar", type: "media" },
      ORDER_FIELD, PUBLISHED_FIELD,
    ],
  },
  partners: {
    label: "Partenaires", api: "partners", searchable: true,
    columns: [{ key: "name", label: "Nom" }, { key: "is_published", label: "Publié", type: "bool" }],
    filters: [PUBLISHED_FILTER],
    fields: [
      { name: "name", label: "Nom", type: "text", required: true },
      { name: "url", label: "Site (URL)", type: "text" },
      { name: "logo_url", label: "Logo", type: "media" },
      ORDER_FIELD, PUBLISHED_FIELD,
    ],
  },
  brands: {
    label: "Marques", api: "brands", searchable: true,
    columns: [{ key: "name", label: "Nom" }, { key: "is_published", label: "Publié", type: "bool" }],
    filters: [PUBLISHED_FILTER],
    fields: [
      { name: "name", label: "Nom", type: "text", required: true },
      { name: "url", label: "Site (URL)", type: "text" },
      { name: "logo", label: "Logo", type: "media" },
      ORDER_FIELD, PUBLISHED_FIELD,
    ],
  },
  team: {
    label: "Équipe", api: "team", searchable: true,
    columns: [{ key: "name", label: "Nom" }, { key: "role", label: "Rôle" },
      { key: "is_published", label: "Publié", type: "bool" }],
    filters: [PUBLISHED_FILTER],
    fields: [
      { name: "name", label: "Nom", type: "text", required: true },
      { name: "role", label: "Rôle", type: "text" },
      { name: "photo", label: "Photo", type: "media" },
      { name: "bio", label: "Bio", type: "textarea" },
      ORDER_FIELD, PUBLISHED_FIELD,
    ],
  },
  documents: {
    label: "Documents", api: "documents", searchable: true,
    columns: [{ key: "title", label: "Titre" }, { key: "category", label: "Catégorie" },
      { key: "is_published", label: "Publié", type: "bool" }],
    filters: [PUBLISHED_FILTER],
    fields: [
      { name: "title", label: "Titre", type: "text", required: true },
      { name: "description", label: "Description", type: "textarea" },
      { name: "file_url", label: "Fichier (URL)", type: "text", required: true },
      { name: "category", label: "Catégorie", type: "text" },
      ORDER_FIELD, PUBLISHED_FIELD,
    ],
  },
  events: {
    label: "Événements", api: "events", searchable: true,
    columns: [{ key: "title", label: "Titre" }, { key: "starts_at", label: "Début", type: "datetime" },
      { key: "status", label: "Statut", type: "badge" }],
    filters: [{ name: "status", label: "Statut", type: "select", options: STATUS }],
    fields: [
      { name: "title", label: "Titre", type: "text", required: true },
      { name: "description", label: "Description", type: "textarea" },
      { name: "starts_at", label: "Début", type: "datetime" },
      { name: "ends_at", label: "Fin", type: "datetime" },
      { name: "location", label: "Lieu", type: "text" },
      { name: "cover_image", label: "Image", type: "media" },
      { name: "status", label: "Statut", type: "select", options: STATUS, default: "draft" },
      { name: "is_featured", label: "À la une", type: "bool" },
    ],
  },
  blog: { ...article("Blog"), api: "blog" },
  news: { ...article("Actualités"), api: "news" },
};
