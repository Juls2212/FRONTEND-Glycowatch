import { useEffect, useRef, useState } from "react";

type Props = {
  deviceId: number;
  deviceName: string;
  active: boolean;
  isLoading: boolean;
  onToggle: (deviceId: number) => Promise<void>;
  onRequestDelete: (deviceId: number, deviceName: string) => void;
};

function GearIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="icon-svg">
      <path
        d="m9.6 4.4.4 1.9a6.6 6.6 0 0 1 2 0l.4-1.9 2.1.7-.4 2a6.8 6.8 0 0 1 1.4 1.4l2-.4.7 2.1-1.9.4a6.6 6.6 0 0 1 0 2l1.9.4-.7 2.1-2-.4a6.8 6.8 0 0 1-1.4 1.4l.4 2-2.1.7-.4-1.9a6.6 6.6 0 0 1-2 0l-.4 1.9-2.1-.7.4-2A6.8 6.8 0 0 1 7.1 17l-2 .4-.7-2.1 1.9-.4a6.6 6.6 0 0 1 0-2l-1.9-.4.7-2.1 2 .4a6.8 6.8 0 0 1 1.4-1.4l-.4-2 2.1-.7Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="12" r="2.3" fill="none" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

export function DeviceRowActions({ deviceId, deviceName, active, isLoading, onToggle, onRequestDelete }: Props) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!isMenuOpen) return;

    const handlePointerDown = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };

    window.addEventListener("mousedown", handlePointerDown);
    return () => {
      window.removeEventListener("mousedown", handlePointerDown);
    };
  }, [isMenuOpen]);

  return (
    <div className="device-row-actions" ref={containerRef}>
      <button type="button" className="ghost-button" disabled={isLoading} onClick={() => void onToggle(deviceId)}>
        {isLoading ? "Guardando..." : active ? "Desactivar" : "Activar"}
      </button>

      <div className="device-settings-wrap">
        <button
          type="button"
          className={`icon-button device-settings-button ${isMenuOpen ? "active" : ""}`}
          aria-label="Abrir opciones del dispositivo"
          aria-haspopup="menu"
          aria-expanded={isMenuOpen}
          disabled={isLoading}
          onClick={() => setIsMenuOpen((current) => !current)}
        >
          <GearIcon />
        </button>

        {isMenuOpen ? (
          <div className="device-settings-menu" role="menu">
            <button
              type="button"
              className="user-dropdown-item danger"
              role="menuitem"
              onClick={() => {
                setIsMenuOpen(false);
                onRequestDelete(deviceId, deviceName);
              }}
            >
              Eliminar dispositivo
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
