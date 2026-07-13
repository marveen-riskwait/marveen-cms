// Sidebar navigation, grouped. `perm` gates visibility (superadmin sees all).
// `resource` is the API name for the generic CRUD pages (next milestone).
export const MODULE_GROUPS = [
  {
    title: "Contenu",
    items: [
      { label: "Pages", path: "/admin/pages", icon: "bi-file-earmark-text", perm: "pages.view", resource: "pages" },
      { label: "Blog", path: "/admin/blog", icon: "bi-journal-text", perm: "blog.view", resource: "blog" },
      { label: "Actualités", path: "/admin/news", icon: "bi-newspaper", perm: "news.view", resource: "news" },
      { label: "Catégories", path: "/admin/categories", icon: "bi-tags", perm: "categories.view", resource: "categories" },
      { label: "FAQ", path: "/admin/faq", icon: "bi-question-circle", perm: "faq.view", resource: "faq" },
      { label: "Témoignages", path: "/admin/testimonials", icon: "bi-chat-quote", perm: "testimonials.view", resource: "testimonials" },
      { label: "Événements", path: "/admin/events", icon: "bi-calendar-event", perm: "events.view", resource: "events" },
      { label: "Documents", path: "/admin/documents", icon: "bi-file-earmark-pdf", perm: "documents.view", resource: "documents" },
    ],
  },
  {
    title: "Médias & vitrine",
    items: [
      { label: "Médiathèque", path: "/admin/media", icon: "bi-images", perm: "media.view", resource: "media" },
      { label: "Partenaires", path: "/admin/partners", icon: "bi-people", perm: "partners.view", resource: "partners" },
      { label: "Marques", path: "/admin/brands", icon: "bi-award", perm: "brands.view", resource: "brands" },
      { label: "Équipe", path: "/admin/team", icon: "bi-person-badge", perm: "team.view", resource: "team" },
    ],
  },
  {
    title: "Configuration",
    items: [
      { label: "Menus", path: "/admin/menus", icon: "bi-list-nested", perm: "menus.view", resource: "menus" },
      { label: "Apparence", path: "/admin/theme", icon: "bi-palette", perm: "settings.view", resource: "theme" },
      { label: "Paramètres", path: "/admin/settings", icon: "bi-gear", perm: "settings.view", resource: "settings" },
      { label: "Utilisateurs", path: "/admin/users", icon: "bi-shield-lock", perm: "users.view", resource: "users" },
      { label: "Intégrations", path: "/admin/integrations", icon: "bi-plugin", perm: "api_tokens.view", resource: "integrations" },
      { label: "Corbeille", path: "/admin/trash", icon: "bi-trash", perm: "trash.view", resource: "trash" },
    ],
  },
];
