import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

export function Topbar({ onToggleSidebar }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [theme, setTheme] = useState(
    document.documentElement.getAttribute("data-bs-theme") || "light");

  const toggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-bs-theme", next);
    localStorage.setItem("admin-theme", next);
    setTheme(next);
  };

  const doLogout = async () => {
    await logout();
    navigate("/login", { replace: true });
  };

  const name = user?.first_name || user?.email || "";

  return (
    <header className="mv-topbar">
      <button className="btn btn-sm btn-outline-secondary d-md-none" onClick={onToggleSidebar}
              aria-label="Menu">
        <i className="bi bi-list" />
      </button>
      <div className="fw-semibold small text-secondary d-none d-md-block">Administration</div>

      <div className="d-flex align-items-center gap-2">
        <button className="btn btn-sm btn-outline-secondary border-0" onClick={toggleTheme}
                aria-label="Thème">
          <i className={`bi ${theme === "dark" ? "bi-sun" : "bi-moon-stars"}`} />
        </button>
        <div className="dropdown">
          <button className="btn btn-sm btn-light dropdown-toggle" data-bs-toggle="dropdown">
            <i className="bi bi-person-circle me-1" /> {name}
          </button>
          <ul className="dropdown-menu dropdown-menu-end">
            <li><span className="dropdown-item-text small text-secondary">{user?.email}</span></li>
            <li><hr className="dropdown-divider" /></li>
            <li><button className="dropdown-item" onClick={doLogout}>
              <i className="bi bi-box-arrow-right me-2" />Déconnexion</button></li>
          </ul>
        </div>
      </div>
    </header>
  );
}
