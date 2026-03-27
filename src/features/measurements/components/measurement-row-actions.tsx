type Props = {
  measurementId: number;
  isDeleting: boolean;
  onDelete: (measurementId: number) => Promise<void>;
};

export function MeasurementRowActions({ measurementId, isDeleting, onDelete }: Props) {
  return (
    <button
      type="button"
      className="ghost-button danger-button"
      disabled={isDeleting}
      onClick={() => void onDelete(measurementId)}
    >
      {isDeleting ? "Eliminando..." : "Eliminar"}
    </button>
  );
}

