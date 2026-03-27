type Props = {
  open: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  cancelLabel: string;
  isProcessing?: boolean;
  onConfirm: () => Promise<void>;
  onCancel: () => void;
};

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel,
  cancelLabel,
  isProcessing = false,
  onConfirm,
  onCancel
}: Props) {
  if (!open) return null;

  return (
    <div className="confirm-overlay" role="dialog" aria-modal="true" aria-label={title}>
      <div className="confirm-dialog">
        <h3 className="confirm-title">{title}</h3>
        <p className="confirm-description">{description}</p>
        <div className="confirm-actions">
          <button type="button" className="ghost-button" disabled={isProcessing} onClick={onCancel}>
            {cancelLabel}
          </button>
          <button type="button" className="primary-button danger-button" disabled={isProcessing} onClick={() => void onConfirm()}>
            {isProcessing ? "Procesando..." : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

