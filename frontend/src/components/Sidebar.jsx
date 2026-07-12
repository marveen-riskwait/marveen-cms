import { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import { ContentTypesAPI } from "../api/client";
import { MODULE_GROUPS } from "../config/modules";
import { useAuth } from "../contexts/AuthContext";

export function Sidebar({ open, onNavigate }) {
  const { can, user } = useAuth();
  const [types, setTypes] = useState([]);

  // User-defined content types appear as their own nav section.
  useEffect(() => {
    if (!can("content.view")) { setTypes([]); return; }
    ContentTypesAPI.list({ per_page: 100 })
      .then((d) => setTypes(d.items || [])).catch(() => setTypes([]));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  return (
    <aside className={`mv-sidebar ${open ? "open" : ""}`}>
      <div className="brand">Marveen<b>CMS</b><i>.</i></div>

      <nav className="mv-nav pb-3">
        <NavLink to="/admin" end onClick={onNavigate}>
          <i className="bi bi-speedometer2" /> Tableau de bord
        </NavLink>

        {(types.length > 0 || can("content_types.view")) && (
          <div>
            <div className="mv-group">Contenus</div>
            {types.map((t) => (
              <NavLink key={t.slug} to={`/admin/content/${t.slug}`} onClick={onNavigate}>
                <i className={`bi ${t.icon || "bi-collection"}`} /> {t.name}
              </NavLink>
            ))}
            {can("content_types.view") && (
              <NavLink to="/admin/content-types" onClick={onNavigate}>
                <i className="bi bi-sliders" /> Types de contenu
              </NavLink>
            )}
          </div>
        )}

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
