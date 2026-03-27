import { PropsWithChildren } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { MobileNav } from "@/components/layout/mobile-nav";

export function AppShell({ children }: PropsWithChildren) {
  return (
    <div className="app-shell">
      <Sidebar />
      <div className="app-main">
        <Topbar />
        <MobileNav />
        <main className="content">{children}</main>
      </div>
    </div>
  );
}
