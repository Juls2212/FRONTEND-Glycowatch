"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV_ITEMS } from "@/components/layout/nav-items";

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="sidebar">
      <div className="sidebar-panel">
        <div className="brand">
          <span className="brand-dot" />
          <div>
            <p className="brand-title">GlycoWatch</p>
            <p className="brand-subtitle">Centro analítico</p>
          </div>
        </div>

        <div className="sidebar-highlight">
          <p className="sidebar-highlight-label">Seguimiento clínico</p>
          <p className="sidebar-highlight-title">Panel preparado para monitoreo continuo con lectura más clara.</p>
        </div>
      </div>

      <div className="sidebar-group">
        <p className="sidebar-group-label">Módulos</p>
        <nav className="sidebar-nav">
          {NAV_ITEMS.map((item) => {
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link key={item.label} href={item.href} className={`nav-link ${active ? "active" : ""}`}>
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="sidebar-footer-card">
        <p className="sidebar-footer-label">Estado visual</p>
        <p className="sidebar-footer-text">Interfaz adaptable al tema activo, estable para navegación y lista para siguientes iteraciones.</p>
      </div>
    </aside>
  );
}
