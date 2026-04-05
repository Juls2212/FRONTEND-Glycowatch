"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { ACCENT_THEMES, AccentTheme, COLOR_MODES, ColorMode } from "@/lib/theme/config";
import { getThemeState, setAccentTheme, setColorMode } from "@/lib/theme/client";

const ACCENT_LABELS: Record<AccentTheme, string> = {
  blue: "Azul",
  red: "Rojo",
  green: "Verde",
  cyan: "Cian",
  amber: "Ámbar"
};

const COLOR_MODE_LABELS: Record<ColorMode, string> = {
  dark: "Oscuro",
  light: "Claro"
};

type PanelPosition = {
  top: number;
  right: number;
};

export function AppearanceMenu() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const [open, setOpen] = useState(false);
  const [colorMode, setColorModeState] = useState<ColorMode>("dark");
  const [accentTheme, setAccentThemeState] = useState<AccentTheme>("blue");
  const [panelPosition, setPanelPosition] = useState<PanelPosition>({ top: 72, right: 16 });

  useEffect(() => {
    const state = getThemeState();
    setColorModeState(state.colorMode);
    setAccentThemeState(state.accentTheme);
  }, []);

  useEffect(() => {
    if (!open) return;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    window.addEventListener("keydown", handleEscape);
    return () => {
      window.removeEventListener("keydown", handleEscape);
    };
  }, [open]);

  useLayoutEffect(() => {
    if (!open) return;

    const updatePosition = () => {
      if (!buttonRef.current) return;
      const rect = buttonRef.current.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const panelWidth = Math.min(320, viewportWidth - 32);
      const right = Math.max(16, viewportWidth - rect.right);
      const top = rect.bottom + 12;
      const safeRight = Math.min(right, Math.max(16, viewportWidth - panelWidth - 16));

      setPanelPosition({ top, right: safeRight });
    };

    updatePosition();
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);

    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [open]);

  const handleModeChange = (nextColorMode: ColorMode) => {
    setColorMode(nextColorMode);
    setColorModeState(nextColorMode);
  };

  const handleAccentChange = (nextAccentTheme: AccentTheme) => {
    setAccentTheme(nextAccentTheme);
    setAccentThemeState(nextAccentTheme);
  };

  return (
    <div className="appearance-menu" ref={containerRef}>
      <button
        ref={buttonRef}
        type="button"
        className={`icon-button ${open ? "active" : ""}`}
        onClick={() => setOpen((current) => !current)}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label="Abrir ajustes de apariencia"
        title="Apariencia"
      >
        <svg viewBox="0 0 24 24" aria-hidden="true" className="icon-svg">
          <path
            d="M12 8.75A3.25 3.25 0 1 0 12 15.25A3.25 3.25 0 1 0 12 8.75Z"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
          />
          <path
            d="M4.94 7.84L3.2 10.86L5.16 12L3.2 13.14L4.94 16.16L7.11 15.54L7.74 17.71L10.86 17.2L12 19.16L13.14 17.2L16.26 17.71L16.89 15.54L19.06 16.16L20.8 13.14L18.84 12L20.8 10.86L19.06 7.84L16.89 8.46L16.26 6.29L13.14 6.8L12 4.84L10.86 6.8L7.74 6.29L7.11 8.46L4.94 7.84Z"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.4"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {open ? (
        <>
          <button
            type="button"
            className="appearance-backdrop"
            aria-label="Cerrar ajustes de apariencia"
            onClick={() => setOpen(false)}
          />

          <div
            className="appearance-dropdown"
            role="dialog"
            aria-label="Ajustes de apariencia"
            style={{ top: `${panelPosition.top}px`, right: `${panelPosition.right}px` }}
          >
            <div className="appearance-section">
              <p className="appearance-title">Apariencia</p>
              <p className="appearance-subtitle">Elige modo y color del panel.</p>
            </div>

            <div className="appearance-section">
              <p className="appearance-label">Modo</p>
              <div className="appearance-segmented" role="group" aria-label="Modo de color">
                {COLOR_MODES.map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    className={`appearance-option ${colorMode === mode ? "active" : ""}`}
                    onClick={() => handleModeChange(mode)}
                    aria-pressed={colorMode === mode}
                  >
                    {COLOR_MODE_LABELS[mode]}
                  </button>
                ))}
              </div>
            </div>

            <div className="appearance-section">
              <p className="appearance-label">Color de acento</p>
              <div className="accent-grid" role="group" aria-label="Temas de color">
                {ACCENT_THEMES.map((theme) => (
                  <button
                    key={theme}
                    type="button"
                    className={`accent-swatch accent-${theme} ${accentTheme === theme ? "active" : ""}`}
                    onClick={() => handleAccentChange(theme)}
                    aria-pressed={accentTheme === theme}
                  >
                    <span className="accent-swatch-dot" aria-hidden="true" />
                    <span>{ACCENT_LABELS[theme]}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
