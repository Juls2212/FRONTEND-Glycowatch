"use client";

import { AppearanceMenu } from "@/components/layout/appearance-menu";
import { NotificationMenu } from "@/components/layout/notification-menu";
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
          <p className="topbar-subtitle">Alertas, apariencia y perfil reunidos en una cabecera más clara y estable.</p>
        </div>
      </div>

      <div className="topbar-actions">
        <NotificationMenu />
        <AppearanceMenu />
        <UserMenu />
      </div>
    </header>
  );
}
