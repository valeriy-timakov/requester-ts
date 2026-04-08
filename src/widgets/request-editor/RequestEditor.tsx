import { HTTP_METHODS } from '@/entities/request/model/requestFile';
import type { RequestAttachment, RequestFile } from '@/shared/types/requester';
import { AuthEditor } from './AuthEditor';
import { AttachmentsPanel } from './AttachmentsPanel';
import { BodyEditor } from './BodyEditor';
import { HeadersEditor } from './HeadersEditor';
import { QueryParamsEditor } from './QueryParamsEditor';
import { RequestOptionsEditor } from './RequestOptionsEditor';

interface RequestEditorProps {
  request: RequestFile | null;
  canSave: boolean;
  isSending: boolean;
  onSave: () => void;
  onSend: () => void;
  onChange: (updater: (request: RequestFile) => RequestFile) => void;
  onAddAttachment: () => void;
  onRemoveAttachment: (attachment: RequestAttachment) => void;
}

export function RequestEditor({
  request,
  canSave,
  isSending,
  onSave,
  onSend,
  onChange,
  onAddAttachment,
  onRemoveAttachment
}: RequestEditorProps) {
  if (!request) {
    return (
      <div className="editor-empty">
        <div className="workspace__label">Request Editor</div>
        <div className="workspace__placeholder">
          Select a request in the tree to open it in a tab.
        </div>
      </div>
    );
  }

  return (
    <div className="editor-panel">
      <div className="editor-panel__header">
        <div>
          <div className="workspace__label">Request Editor</div>
          <div className="editor-panel__subtitle">
            Manual save only. No autosave.
          </div>
        </div>
        <div className="editor-panel__actions">
          <button className="action-button" onClick={onSave} type="button">
            Save
          </button>
          <button
            className="action-button action-button--primary"
            onClick={onSend}
            disabled={isSending}
            type="button"
          >
            {isSending ? 'Sending...' : 'Send'}
          </button>
        </div>
      </div>

      <label className="field-group">
        <span className="field-group__label">Name</span>
        <input
          className="field-input"
          value={request.name}
          onChange={(event) =>
            onChange((draft) => ({
              ...draft,
              name: event.target.value
            }))
          }
        />
      </label>

      <div className="editor-row">
        <label className="field-group field-group--compact">
          <span className="field-group__label">Method</span>
          <select
            className="field-input"
            value={request.method}
            onChange={(event) =>
              onChange((draft) => ({
                ...draft,
                method: event.target.value as RequestFile['method']
              }))
            }
          >
            {HTTP_METHODS.map((method) => (
              <option key={method} value={method}>
                {method}
              </option>
            ))}
          </select>
        </label>

        <div className="save-indicator">
          {canSave ? 'Unsaved changes' : 'Saved'}
        </div>
      </div>

      <label className="field-group">
        <span className="field-group__label">URL</span>
        <input
          className="field-input"
          placeholder="https://api.example.com/resource"
          value={request.url}
          onChange={(event) =>
            onChange((draft) => ({
              ...draft,
              url: event.target.value
            }))
          }
        />
      </label>

      <QueryParamsEditor
        queryParams={request.queryParams}
        onChange={(queryParams) =>
          onChange((draft) => ({
            ...draft,
            queryParams
          }))
        }
      />

      <HeadersEditor
        headers={request.headers}
        onChange={(headers) =>
          onChange((draft) => ({
            ...draft,
            headers
          }))
        }
      />

      <AuthEditor
        auth={request.auth}
        onChange={(auth) =>
          onChange((draft) => ({
            ...draft,
            auth
          }))
        }
      />

      <BodyEditor
        body={request.body}
        onChange={(body) =>
          onChange((draft) => ({
            ...draft,
            body
          }))
        }
      />

      <RequestOptionsEditor
        requestOptions={request.requestOptions}
        onChange={(requestOptions) =>
          onChange((draft) => ({
            ...draft,
            requestOptions
          }))
        }
      />

      <AttachmentsPanel
        attachments={request.attachments ?? []}
        onAddAttachment={onAddAttachment}
        onRemoveAttachment={onRemoveAttachment}
      />
    </div>
  );
}
