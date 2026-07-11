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
