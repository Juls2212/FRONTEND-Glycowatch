"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/auth-store";

type UserMenuProps = {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
};

export function UserMenu({ open: controlledOpen, onOpenChange }: UserMenuProps) {
  const router = useRouter();
  const logout = useAuthStore((state) => state.logout);
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const open = controlledOpen ?? uncontrolledOpen;

  const setOpen = (nextOpen: boolean) => {
    if (controlledOpen === undefined) {
      setUncontrolledOpen(nextOpen);
    }
    onOpenChange?.(nextOpen);
  };

  useEffect(() => {
    if (!open) return;

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
  }, [open]);

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
        onClick={() => setOpen(!open)}
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
