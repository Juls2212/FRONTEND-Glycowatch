"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV_ITEMS } from "@/components/layout/nav-items";

type SidebarProps = {
  collapsed: boolean;
  onToggle: () => void;
};

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside className={`sidebar ${collapsed ? "collapsed" : ""}`}>
      <div className="sidebar-panel">
        <div className="sidebar-header">
          <div className="brand">
            <span className="brand-dot" />
            {!collapsed ? (
              <div className="brand-copy">
                <p className="brand-title">GlycoWatch</p>
                <p className="brand-subtitle">Centro analítico</p>
              </div>
            ) : null}
          </div>

          <button
            type="button"
            className="sidebar-toggle-button"
            aria-label={collapsed ? "Expandir barra lateral" : "Contraer barra lateral"}
            title={collapsed ? "Expandir barra lateral" : "Contraer barra lateral"}
            onClick={onToggle}
          >
            <span className={`sidebar-toggle-chevron ${collapsed ? "collapsed" : ""}`} aria-hidden="true">
              ‹
            </span>
          </button>
        </div>

        {!collapsed ? (
          <div className="sidebar-highlight">
            <p className="sidebar-highlight-label">Seguimiento clínico</p>
            <p className="sidebar-highlight-title">Panel preparado para monitoreo continuo con lectura más clara.</p>
          </div>
        ) : null}
      </div>

      <div className="sidebar-group">
        {!collapsed ? <p className="sidebar-group-label">Módulos</p> : null}
        <nav className="sidebar-nav">
          {NAV_ITEMS.map((item) => {
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.label}
                href={item.href}
                className={`nav-link ${active ? "active" : ""} ${collapsed ? "compact" : ""}`}
                title={collapsed ? item.label : undefined}
                aria-label={collapsed ? item.label : undefined}
              >
                <span className="nav-link-text">{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {!collapsed ? (
        <div className="sidebar-footer-card">
          <p className="sidebar-footer-label">Estado visual</p>
          <p className="sidebar-footer-text">Interfaz adaptable al tema activo, estable para navegación y lista para siguientes iteraciones.</p>
        </div>
      ) : null}
    </aside>
  );
}
