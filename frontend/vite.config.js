import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// The admin SPA (port 5173) talks to the Flask API same-origin via a dev proxy,
// which avoids CORS and cross-site cookie issues (important in Codespaces).
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: true,
    proxy: {
      "/api": { target: "http://localhost:3001", changeOrigin: true },
      "/media": { target: "http://localhost:3001", changeOrigin: true },
    },
    allowedHosts: [".app.github.dev", "localhost", "127.0.0.1"],
  },
  build: { outDir: "dist" },
});
