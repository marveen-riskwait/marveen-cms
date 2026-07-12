import { Navigate, Route, Routes } from "react-router-dom";

import { ProtectedRoute } from "./components/ProtectedRoute";
import { AdminLayout } from "./layouts/AdminLayout";
import { Dashboard } from "./pages/Dashboard";
import { Login } from "./pages/Login";
import { MediaLibrary } from "./pages/MediaLibrary";
import { Placeholder } from "./pages/Placeholder";
import { ResourcePage } from "./pages/ResourcePage";

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route path="/admin" element={<ProtectedRoute><AdminLayout /></ProtectedRoute>}>
        <Route index element={<Dashboard />} />
        <Route path="media" element={<MediaLibrary />} />
        {/* Generic CRUD screen for every declared module (see config/resources.js). */}
        <Route path=":resource" element={<ResourcePage />} />
        <Route path="*" element={<Placeholder />} />
      </Route>

      <Route path="/" element={<Navigate to="/admin" replace />} />
      <Route path="*" element={<Navigate to="/admin" replace />} />
    </Routes>
  );
}
