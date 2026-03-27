"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/auth-store";

export function UserMenu() {
  const router = useRouter();
  const logout = useAuthStore((state) => state.logout);
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!containerRef.current) return;
      if (!containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    window.addEventListener("mousedown", handleClickOutside);
    return () => {
      window.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const goToProfile = () => {
    setOpen(false);
    router.push("/profile");
  };

  const handleLogout = () => {
    setOpen(false);
    logout();
    router.replace("/login");
  };

  return (
    <div className="user-menu" ref={containerRef}>
      <button
        type="button"
        className="avatar-button"
        onClick={() => setOpen((current) => !current)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Abrir menú de usuario"
      >
        <span className="avatar-placeholder">U</span>
      </button>

      {open ? (
        <div className="user-dropdown" role="menu">
          <button type="button" className="user-dropdown-item" onClick={goToProfile}>
            Administrar perfil
          </button>
          <button type="button" className="user-dropdown-item danger" onClick={handleLogout}>
            Cerrar sesión
          </button>
        </div>
      ) : null}
    </div>
  );
}

