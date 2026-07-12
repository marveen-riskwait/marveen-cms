import { Navigate, Route, Routes } from "react-router-dom";

import { ProtectedRoute } from "./components/ProtectedRoute";
import { AdminLayout } from "./layouts/AdminLayout";
import { Dashboard } from "./pages/Dashboard";
import { Login } from "./pages/Login";
import { MediaLibrary } from "./pages/MediaLibrary";
import { PageBuilder } from "./pages/PageBuilder";
import { PagesList } from "./pages/PagesList";
import { Placeholder } from "./pages/Placeholder";
import { ResourcePage } from "./pages/ResourcePage";
import { Users } from "./pages/Users";

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route path="/admin" element={<ProtectedRoute><AdminLayout /></ProtectedRoute>}>
        <Route index element={<Dashboard />} />
        <Route path="pages" element={<PagesList />} />
        <Route path="pages/new" element={<PageBuilder />} />
        <Route path="pages/:id" element={<PageBuilder />} />
        <Route path="media" element={<MediaLibrary />} />
        <Route path="users" element={<Users />} />
        {/* Generic CRUD screen for every declared module (see config/resources.js). */}
        <Route path=":resource" element={<ResourcePage />} />
        <Route path="*" element={<Placeholder />} />
      </Route>

      <Route path="/" element={<Navigate to="/admin" replace />} />
      <Route path="*" element={<Navigate to="/admin" replace />} />
    </Routes>
  );
}
