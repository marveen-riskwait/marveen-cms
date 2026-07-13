// Server-side data access to the Marveen CMS public API. All reads are
// uncached so published changes appear immediately (swap for `next: { revalidate }`
// to enable ISR in production).
const BASE = process.env.CMS_API_URL || "http://localhost:3001";

async function get(path) {
  let res;
  try {
    res = await fetch(`${BASE}/api/public${path}`, { cache: "no-store" });
  } catch {
    return null; // API unreachable — let pages render their empty/404 state
  }
  if (!res.ok) return null;
  const json = await res.json().catch(() => null);
  return json?.data ?? null;
}

export const getHome = (locale = "fr") => get(`/home?locale=${locale}`);
export const getPage = (slug, locale = "fr") =>
  get(`/pages/${encodeURIComponent(slug)}?locale=${locale}`);
export const getPreview = (token) => get(`/preview?token=${encodeURIComponent(token)}`);
export const getSettings = () => get(`/settings`);
export const getMenu = (location) => get(`/menus/${location}`);

// Blog / Actualités (published). List returns { items, meta }.
async function getList(path) {
  try {
    const res = await fetch(`${BASE}/api/public${path}`, { cache: "no-store" });
    if (!res.ok) return { items: [] };
    return await res.json();
  } catch { return { items: [] }; }
}
export const getBlogList = () => getList(`/blog`);
export const getBlogPost = (slug) => get(`/blog/${encodeURIComponent(slug)}`);

// Media URL for use in the browser. Relative `/media/...` paths are kept
// same-origin (served by a Next rewrite → backend, see next.config.js), so the
// browser never needs to reach the API host directly — which matters behind a
// proxy or in Codespaces. Absolute URLs (external images) pass through.
export const mediaUrl = (url) => url || "";
