// Shared axios client. The session is an httpOnly cookie (withCredentials);
// the CSRF token is echoed on writes from localStorage.
import axios from "axios";

export const api = axios.create({
  baseURL: (import.meta.env.VITE_API_URL || "") + "/api",
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  const csrf = localStorage.getItem("csrf_token");
  const method = (config.method || "").toLowerCase();
  if (csrf && !["get", "head", "options"].includes(method)) {
    config.headers["X-CSRF-TOKEN"] = csrf;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response && err.response.status === 401) {
      localStorage.removeItem("csrf_token");
    }
    return Promise.reject(err);
  }
);

export const AuthAPI = {
  login: (body) => api.post("/auth/login", body).then((r) => r.data),
  logout: () => api.post("/auth/logout").then((r) => r.data),
  me: () => api.get("/auth/me").then((r) => r.data),
};

export const DashboardAPI = {
  stats: () => api.get("/dashboard/stats").then((r) => r.data.data),
};

// Media library: browse is a normal list; upload is multipart.
export const MediaAPI = {
  list: (params) => api.get("/media", { params }).then((r) => r.data),
  upload: (file, meta = {}, onProgress) => {
    const form = new FormData();
    form.append("file", file);
    if (meta.alt) form.append("alt", meta.alt);
    if (meta.title) form.append("title", meta.title);
    if (meta.tags) form.append("tags", meta.tags);
    return api
      .post("/media", form, {
        headers: { "Content-Type": "multipart/form-data" },
        onUploadProgress: (e) =>
          onProgress && e.total && onProgress(Math.round((e.loaded / e.total) * 100)),
      })
      .then((r) => r.data.data);
  },
  update: (id, body) => api.patch(`/media/${id}`, body).then((r) => r.data.data),
  remove: (id) => api.delete(`/media/${id}`).then((r) => r.data),
};

// Site settings: read the whole map, upsert one key at a time.
export const SettingsAPI = {
  getAll: () => api.get("/settings").then((r) => r.data.data), // { items, map }
  put: (key, value, group, is_public) =>
    api.put(`/settings/${key}`, { value, group, is_public }).then((r) => r.data.data),
};

// Content engine: user-defined types + their entries (dynamic per type).
export const ContentTypesAPI = {
  list: (params) => api.get("/content-types", { params }).then((r) => r.data),
  get: (id) => api.get(`/content-types/${id}`).then((r) => r.data.data),
  create: (body) => api.post("/content-types", body).then((r) => r.data.data),
  update: (id, body) => api.patch(`/content-types/${id}`, body).then((r) => r.data.data),
  remove: (id) => api.delete(`/content-types/${id}`).then((r) => r.data),
};

export const contentEntries = (slug) => ({
  list: (params) => api.get(`/content/${slug}`, { params }).then((r) => r.data),
  get: (id) => api.get(`/content/${slug}/${id}`).then((r) => r.data.data),
  create: (body) => api.post(`/content/${slug}`, body).then((r) => r.data.data),
  update: (id, body) => api.patch(`/content/${slug}/${id}`, body).then((r) => r.data.data),
  remove: (id) => api.delete(`/content/${slug}/${id}`).then((r) => r.data),
});

// Page-specific actions: draft preview token + revision history.
export const PagesAPI = {
  previewToken: (id) => api.get(`/pages/${id}/preview`).then((r) => r.data.data),
  revisions: (id, params) => api.get(`/pages/${id}/revisions`, { params }).then((r) => r.data),
  restoreRevision: (id, rid) =>
    api.post(`/pages/${id}/revisions/${rid}/restore`).then((r) => r.data.data),
};

// Roles listing (read-only) for the user editor's role picker.
export const RolesAPI = {
  list: () => api.get("/roles").then((r) => r.data.data),
};

// Generic CRUD client for any module (used by the next milestone's tables).
export const resource = (name) => ({
  list: (params) => api.get(`/${name}`, { params }).then((r) => r.data),
  get: (id) => api.get(`/${name}/${id}`).then((r) => r.data.data),
  create: (body) => api.post(`/${name}`, body).then((r) => r.data.data),
  update: (id, body) => api.patch(`/${name}/${id}`, body).then((r) => r.data.data),
  remove: (id) => api.delete(`/${name}/${id}`).then((r) => r.data),
});

export const errMsg = (err, fallback = "Une erreur est survenue") =>
  err?.response?.data?.message || fallback;
