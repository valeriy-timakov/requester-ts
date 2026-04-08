import type { RequestAttachment } from '@/shared/types/requester';

interface AttachmentsPanelProps {
  attachments: RequestAttachment[];
  onAddAttachment: () => void;
  onRemoveAttachment: (attachment: RequestAttachment) => void;
}

function formatAttachmentSize(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`;
  }

  const kb = bytes / 1024;
  if (kb < 1024) {
    return `${kb.toFixed(1)} KB`;
  }

  const mb = kb / 1024;
  return `${mb.toFixed(1)} MB`;
}

export function AttachmentsPanel({
  attachments,
  onAddAttachment,
  onRemoveAttachment
}: AttachmentsPanelProps) {
  return (
    <section className="attachments-panel">
      <div className="attachments-panel__header">
        <span className="field-group__label">Attachments</span>
        <button className="action-button" onClick={onAddAttachment} type="button">
          Add attachment
        </button>
      </div>

      {attachments.length === 0 ? (
        <div className="attachments-panel__empty">No attachments.</div>
      ) : (
        <ul className="attachments-list">
          {attachments.map((attachment) => (
            <li
              className="attachments-item"
              key={`${attachment.relativePath}:${attachment.size}`}
            >
              <div className="attachments-item__meta">
                <div className="attachments-item__name">{attachment.fileName}</div>
                <div className="attachments-item__size">
                  {formatAttachmentSize(attachment.size)}
                </div>
              </div>
              <button
                className="action-button tree-node__delete"
                onClick={() => {
                  onRemoveAttachment(attachment);
                }}
                type="button"
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
