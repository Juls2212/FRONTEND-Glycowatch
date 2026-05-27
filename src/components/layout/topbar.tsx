"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { AppearanceMenu } from "@/components/layout/appearance-menu";
import { NAV_ITEMS } from "@/components/layout/nav-items";
import { NotificationMenu } from "@/components/layout/notification-menu";
import { UserMenu } from "@/components/layout/user-menu";

type TopbarProps = {
  sidebarCollapsed: boolean;
  onToggleSidebar: () => void;
};

const PAGE_SUBTITLES: Record<string, string> = {
  "/dashboard": "Consulta metricas clave, actividad reciente y seguimiento clinico desde una vista mas ligera.",
  "/measurements": "Revisa registros, tendencias y carga manual con una estructura mas clara.",
  "/alerts": "Monitorea eventos activos y prioriza respuestas desde un modulo mas ordenado.",
  "/devices": "Gestiona tus dispositivos conectados con una navegacion mas limpia y estable.",
  "/profile": "Centraliza datos personales y clinicos en un espacio mas legible y consistente.",
  "/analytics": "Explora tendencias, conclusiones y analisis inteligente con mejor contexto visual."
};

export function Topbar({ sidebarCollapsed, onToggleSidebar }: TopbarProps) {
  const [activeMenu, setActiveMenu] = useState<"appearance" | "user" | null>(null);
  const pathname = usePathname();

  const activePage = NAV_ITEMS.find((item) => pathname === item.href || pathname.startsWith(`${item.href}/`));
  const title = activePage?.label ?? "GlycoWatch";
  const subtitle = activePage ? PAGE_SUBTITLES[activePage.href] : "Monitoreo, navegacion y acciones globales dentro de una interfaz clinica mas calmada.";

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
          <p className="topbar-eyebrow">Navegacion clinica</p>
          <h1 className="topbar-title">{title}</h1>
          <p className="topbar-subtitle">{subtitle}</p>
        </div>
      </div>

      <div className="topbar-actions">
        <div className="topbar-actions-cluster">
          <NotificationMenu />
          <AppearanceMenu
            open={activeMenu === "appearance"}
            onOpenChange={(open) =>
              setActiveMenu((current) => (open ? "appearance" : current === "appearance" ? null : current))
            }
          />
        </div>
        <UserMenu
          open={activeMenu === "user"}
          onOpenChange={(open) => setActiveMenu((current) => (open ? "user" : current === "user" ? null : current))}
        />
      </div>
    </header>
  );
}
