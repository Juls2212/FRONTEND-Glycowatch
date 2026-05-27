"use client";

import { PropsWithChildren, useEffect, useState } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { MobileNav } from "@/components/layout/mobile-nav";

const SIDEBAR_STORAGE_KEY = "glycowatch-sidebar-collapsed";

export function AppShell({ children }: PropsWithChildren) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(SIDEBAR_STORAGE_KEY);
      setSidebarCollapsed(stored === "true");
    } catch {
      setSidebarCollapsed(false);
    }
  }, []);

  const toggleSidebar = () => {
    setSidebarCollapsed((current) => {
      const next = !current;
      try {
        window.localStorage.setItem(SIDEBAR_STORAGE_KEY, String(next));
      } catch {}
      return next;
    });
  };

  return (
    <div className={`app-shell ${sidebarCollapsed ? "sidebar-collapsed" : ""}`}>
      <Sidebar collapsed={sidebarCollapsed} onToggle={toggleSidebar} />
      <div className="app-main">
        <div className="app-main-shell">
          <Topbar sidebarCollapsed={sidebarCollapsed} onToggleSidebar={toggleSidebar} />
          <div className="app-content-shell">
            <MobileNav />
            <main className="content">
              <div className="page-container">{children}</div>
            </main>
          </div>
        </div>
      </div>
    </div>
  );
}
