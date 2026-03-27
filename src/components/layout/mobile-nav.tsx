"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV_ITEMS } from "@/components/layout/nav-items";

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="mobile-nav" aria-label="Navegación móvil">
      {NAV_ITEMS.map((item) => {
        const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
        return (
          <Link key={item.href} href={item.href} className={`mobile-nav-link ${active ? "active" : ""}`}>
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

