export type NavIcon =
  | "dashboard"
  | "measurements"
  | "alerts"
  | "devices"
  | "profile"
  | "analytics";

export const NAV_ITEMS: Array<{ href: string; label: string; icon: NavIcon }> = [
  { href: "/dashboard", label: "Panel", icon: "dashboard" },
  { href: "/measurements", label: "Mediciones", icon: "measurements" },
  { href: "/alerts", label: "Alertas", icon: "alerts" },
  { href: "/devices", label: "Dispositivos", icon: "devices" },
  { href: "/profile", label: "Perfil", icon: "profile" },
  { href: "/analytics", label: "Análisis", icon: "analytics" }
];
