import type { KeyValueEntry } from '@/shared/types/requester';

interface HeadersEditorProps {
  headers: KeyValueEntry[];
  onChange: (headers: KeyValueEntry[]) => void;
}

export function HeadersEditor({ headers, onChange }: HeadersEditorProps) {
  const safeHeaders = Array.isArray(headers) ? headers : [];

  function handleRowChange(
    rowIndex: number,
    field: 'key' | 'value',
    value: string
  ) {
    onChange(
      safeHeaders.map((entry, index) =>
        index === rowIndex ? { ...entry, [field]: value } : entry
      )
    );
  }

  function handleAddRow() {
    onChange([...safeHeaders, { key: '', value: '' }]);
  }

  function handleRemoveRow(rowIndex: number) {
    onChange(safeHeaders.filter((_, index) => index !== rowIndex));
  }

  return (
    <section className="editor-section">
      <div className="editor-section__header">
        <span className="field-group__label">Headers</span>
        <button
          className="action-button"
          onClick={handleAddRow}
          type="button"
        >
          Add
        </button>
      </div>

      {safeHeaders.length === 0 ? (
        <div className="editor-section__empty">No headers.</div>
      ) : null}

      <div className="key-value-list">
        {safeHeaders.map((entry, index) => (
          <div className="key-value-row" key={`header-${index}`}>
            <input
              className="field-input"
              placeholder="Header name"
              value={entry.key}
              onChange={(event) =>
                handleRowChange(index, 'key', event.target.value)
              }
            />
            <input
              className="field-input"
              placeholder="Header value"
              value={entry.value}
              onChange={(event) =>
                handleRowChange(index, 'value', event.target.value)
              }
            />
            <button
              className="action-button"
              onClick={() => handleRemoveRow(index)}
              type="button"
            >
              Remove
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}
