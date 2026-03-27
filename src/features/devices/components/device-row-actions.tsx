type Props = {
  deviceId: number;
  active: boolean;
  isLoading: boolean;
  onToggle: (deviceId: number) => Promise<void>;
};

export function DeviceRowActions({ deviceId, active, isLoading, onToggle }: Props) {
  return (
    <button type="button" className="ghost-button" disabled={isLoading} onClick={() => void onToggle(deviceId)}>
      {isLoading ? "Guardando..." : active ? "Desactivar" : "Activar"}
    </button>
  );
}

