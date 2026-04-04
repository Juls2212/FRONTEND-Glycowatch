"use client";

import { AppearanceMenu } from "@/components/layout/appearance-menu";
import { UserMenu } from "@/components/layout/user-menu";

export function Topbar() {
  return (
    <header className="topbar">
      <div>
        <h1 className="topbar-title">Panel de control</h1>
        <p className="topbar-subtitle">Monitoreo glucémico en tiempo real cercano</p>
      </div>
      <div className="topbar-actions">
        <AppearanceMenu />
        <UserMenu />
      </div>
    </header>
  );
}
