"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV_ITEMS, NavIcon } from "@/components/layout/nav-items";

type SidebarProps = {
  collapsed: boolean;
  onToggle: () => void;
};

function NavItemIcon({ icon }: { icon: NavIcon }) {
  if (icon === "dashboard") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true" className="nav-icon-svg">
        <path d="M4.75 5.5h6.5v5.75h-6.5zM12.75 5.5h6.5V9h-6.5zM12.75 10.75h6.5v7.75h-6.5zM4.75 13h6.5v5.5h-6.5z" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
      </svg>
    );
  }
  if (icon === "measurements") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true" className="nav-icon-svg">
        <path d="M7 18.5V9.5M12 18.5V5.5M17 18.5v-6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    );
  }
  if (icon === "alerts") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true" className="nav-icon-svg">
        <path
          d="M12 4.75A4.25 4.25 0 0 0 7.75 9v2.1c0 .8-.23 1.58-.66 2.25l-1.18 1.8a.8.8 0 0 0 .67 1.23h10.84a.8.8 0 0 0 .67-1.23l-1.18-1.8a4.12 4.12 0 0 1-.66-2.25V9A4.25 4.25 0 0 0 12 4.75Z"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinejoin="round"
        />
        <path d="M10.25 18.25a1.75 1.75 0 0 0 3.5 0" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
    );
  }
  if (icon === "devices") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true" className="nav-icon-svg">
        <rect x="7.25" y="5.75" width="9.5" height="12.5" rx="2" fill="none" stroke="currentColor" strokeWidth="1.6" />
        <path d="M10 3.75v2M14 3.75v2M10 18.25v2M14 18.25v2" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
    );
  }
  if (icon === "profile") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true" className="nav-icon-svg">
        <path d="M12 12a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7ZM6 19.25a6 6 0 0 1 12 0" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="nav-icon-svg">
      <path d="M6 16.75h12M6 12h12M6 7.25h8" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

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
                <p className="brand-subtitle">Plataforma clinica</p>
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
            <p className="sidebar-highlight-label">Entorno clinico</p>
            <p className="sidebar-highlight-title">Navegacion ligera y mejor foco en el seguimiento diario.</p>
          </div>
        ) : null}
      </div>

      <div className="sidebar-group">
        {!collapsed ? <p className="sidebar-group-label">Modulos</p> : null}
        <nav className="sidebar-nav">
          {NAV_ITEMS.map((item) => {
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.label}
                href={item.href}
                className={`nav-link ${active ? "active" : ""} ${collapsed ? "compact" : ""}`}
                title={collapsed ? item.label : undefined}
                aria-label={item.label}
              >
                <span className="nav-icon" aria-hidden="true">
                  <NavItemIcon icon={item.icon} />
                </span>
                {!collapsed ? <span className="nav-link-text">{item.label}</span> : null}
              </Link>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}
