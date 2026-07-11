import { useLocation } from "react-router-dom";

// Temporary page for modules whose admin screen is not built yet. The generic
// CRUD tables replace this in the next milestone.
export function Placeholder() {
  const { pathname } = useLocation();
  const name = pathname.split("/").filter(Boolean).pop() || "module";
  return (
    <div className="text-center text-secondary py-5">
      <i className="bi bi-cone-striped" style={{ fontSize: "2.5rem" }} />
      <h2 className="h5 mt-3 text-capitalize">{name}</h2>
      <p>Cet écran d'administration arrive au prochain incrément.</p>
    </div>
  );
}
