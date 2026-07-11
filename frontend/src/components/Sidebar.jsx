import { NavLink } from "react-router-dom";
import { MODULE_GROUPS } from "../config/modules";
import { useAuth } from "../contexts/AuthContext";

export function Sidebar({ open, onNavigate }) {
  const { can } = useAuth();

  return (
    <aside className={`mv-sidebar ${open ? "open" : ""}`}>
      <div className="brand">Marveen<b>CMS</b><i>.</i></div>

      <nav className="mv-nav pb-3">
        <NavLink to="/admin" end onClick={onNavigate}>
          <i className="bi bi-speedometer2" /> Tableau de bord
        </NavLink>

        {MODULE_GROUPS.map((group) => {
          const items = group.items.filter((it) => can(it.perm));
          if (items.length === 0) return null;
          return (
            <div key={group.title}>
              <div className="mv-group">{group.title}</div>
              {items.map((it) => (
                <NavLink key={it.path} to={it.path} onClick={onNavigate}>
                  <i className={`bi ${it.icon}`} /> {it.label}
                </NavLink>
              ))}
            </div>
          );
        })}
      </nav>
    </aside>
  );
}
