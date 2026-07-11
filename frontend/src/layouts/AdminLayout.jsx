import { useState } from "react";
import { Outlet } from "react-router-dom";
import { Sidebar } from "../components/Sidebar";
import { Topbar } from "../components/Topbar";

export function AdminLayout() {
  const [open, setOpen] = useState(false);

  return (
    <div className="mv-shell">
      {open && <div className="mv-backdrop d-md-none" onClick={() => setOpen(false)} />}
      <Sidebar open={open} onNavigate={() => setOpen(false)} />
      <div className="mv-main">
        <Topbar onToggleSidebar={() => setOpen((v) => !v)} />
        <main className="mv-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
