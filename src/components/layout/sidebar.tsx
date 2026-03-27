"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV_ITEMS } from "@/components/layout/nav-items";

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="sidebar">
      <div className="brand">
        <span className="brand-dot" />
        <div>
          <p className="brand-title">GlycoWatch</p>
          <p className="brand-subtitle">Centro analítico</p>
        </div>
      </div>

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
    </aside>
  );
}

