interface PromptDialogState {
  kind: 'prompt';
  title: string;
  confirmLabel: string;
  value: string;
  onChange: (value: string) => void;
  onConfirm: () => void;
  onCancel: () => void;
}

interface ConfirmDialogState {
  kind: 'confirm';
  title: string;
  message: string;
  confirmLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export type DialogModalState = PromptDialogState | ConfirmDialogState;

interface DialogModalProps {
  dialog: DialogModalState | null;
}

export function DialogModal({ dialog }: DialogModalProps) {
  if (!dialog) {
    return null;
  }

  return (
    <div className="dialog-backdrop" role="presentation">
      <div
        className="dialog-card"
        role="dialog"
        aria-modal="true"
        aria-label={dialog.title}
      >
        <div className="dialog-card__title">{dialog.title}</div>

        {dialog.kind === 'prompt' ? (
          <input
            autoFocus
            className="field-input"
            value={dialog.value}
            onChange={(event) => dialog.onChange(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                dialog.onConfirm();
              }

              if (event.key === 'Escape') {
                dialog.onCancel();
              }
            }}
          />
        ) : (
          <div className="dialog-card__message">{dialog.message}</div>
        )}

        <div className="dialog-card__actions">
          <button
            className="action-button"
            onClick={dialog.onCancel}
            type="button"
          >
            Cancel
          </button>
          <button
            className="action-button action-button--primary"
            onClick={dialog.onConfirm}
            type="button"
          >
            {dialog.confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
