"use client";

import { AppearanceMenu } from "@/components/layout/appearance-menu";
import { UserMenu } from "@/components/layout/user-menu";

type TopbarProps = {
  sidebarCollapsed: boolean;
  onToggleSidebar: () => void;
};

export function Topbar({ sidebarCollapsed, onToggleSidebar }: TopbarProps) {
  return (
    <header className="topbar">
      <div className="topbar-main">
        <button
          type="button"
          className="topbar-sidebar-toggle"
          aria-label={sidebarCollapsed ? "Expandir barra lateral" : "Contraer barra lateral"}
          onClick={onToggleSidebar}
        >
          <span />
          <span />
          <span />
        </button>

        <div className="topbar-copy">
          <p className="topbar-eyebrow">Centro de monitoreo</p>
          <h1 className="topbar-title">Panel de control</h1>
          <p className="topbar-subtitle">Seguimiento glucémico claro, continuo y preparado para una experiencia más final.</p>
        </div>
      </div>

      <div className="topbar-actions">
        <AppearanceMenu />
        <UserMenu />
      </div>
    </header>
  );
}
