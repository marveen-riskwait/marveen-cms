import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { DashboardAPI, errMsg } from "../api/client";
import { useAuth } from "../contexts/AuthContext";

const CARDS = [
  { key: "pages", label: "Pages", icon: "bi-file-earmark-text", to: "/admin/pages" },
  { key: "blog", label: "Articles", icon: "bi-journal-text", to: "/admin/blog" },
  { key: "news", label: "Actualités", icon: "bi-newspaper", to: "/admin/news" },
  { key: "events", label: "Événements", icon: "bi-calendar-event", to: "/admin/events" },
  { key: "media", label: "Médias", icon: "bi-images", to: "/admin/media" },
  { key: "testimonials", label: "Témoignages", icon: "bi-chat-quote", to: "/admin/testimonials" },
  { key: "documents", label: "Documents", icon: "bi-file-earmark-pdf", to: "/admin/documents" },
  { key: "users", label: "Utilisateurs", icon: "bi-people", to: "/admin/users" },
];

const STATUS_BADGE = {
  published: "success", draft: "secondary", scheduled: "info", archived: "dark",
};

export function Dashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    DashboardAPI.stats().then(setData).catch((e) => setError(errMsg(e)));
  }, []);

  const counts = data?.counts || {};
  const recent = data?.recent || {};

  return (
    <div>
      <h1 className="h4 mb-1">Bonjour {user?.first_name || ""} 👋</h1>
      <p className="text-secondary">Voici l'activité de votre site.</p>

      {error && <div className="alert alert-danger">{error}</div>}

      <div className="row g-3 mb-4">
        {CARDS.map((card) => (
          <div className="col-6 col-md-3" key={card.key}>
            <Link to={card.to} className="text-reset">
              <div className="stat-card p-3 h-100 bg-body">
                <div className="d-flex justify-content-between align-items-start">
                  <div>
                    <div className="n">{counts[card.key] ?? "—"}</div>
                    <div className="l">{card.label}</div>
                  </div>
                  <i className={`bi ${card.icon}`} />
                </div>
              </div>
            </Link>
          </div>
        ))}
      </div>

      <div className="row g-3">
        <div className="col-lg-6">
          <div className="card">
            <div className="card-header bg-body fw-semibold">Derniers articles</div>
            <ul className="list-group list-group-flush">
              {(recent.articles || []).map((a) => (
                <li key={a.id} className="list-group-item d-flex justify-content-between align-items-center">
                  <span className="text-truncate me-2">{a.title}</span>
                  <span className={`badge bg-${STATUS_BADGE[a.status] || "secondary"}`}>{a.status}</span>
                </li>
              ))}
              {(recent.articles || []).length === 0 && (
                <li className="list-group-item text-secondary small">Aucun article.</li>
              )}
            </ul>
          </div>
        </div>
        <div className="col-lg-6">
          <div className="card">
            <div className="card-header bg-body fw-semibold">Dernières pages</div>
            <ul className="list-group list-group-flush">
              {(recent.pages || []).map((p) => (
                <li key={p.id} className="list-group-item d-flex justify-content-between align-items-center">
                  <span className="text-truncate me-2">{p.title}</span>
                  <span className={`badge bg-${STATUS_BADGE[p.status] || "secondary"}`}>{p.status}</span>
                </li>
              ))}
              {(recent.pages || []).length === 0 && (
                <li className="list-group-item text-secondary small">Aucune page.</li>
              )}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
