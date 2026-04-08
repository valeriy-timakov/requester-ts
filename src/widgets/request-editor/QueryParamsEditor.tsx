import type { KeyValueEntry } from '@/shared/types/requester';

interface QueryParamsEditorProps {
  queryParams: KeyValueEntry[];
  onChange: (queryParams: KeyValueEntry[]) => void;
}

export function QueryParamsEditor({
  queryParams,
  onChange
}: QueryParamsEditorProps) {
  const safeQueryParams = Array.isArray(queryParams) ? queryParams : [];

  function handleRowChange(
    rowIndex: number,
    field: 'key' | 'value',
    value: string
  ) {
    onChange(
      safeQueryParams.map((entry, index) =>
        index === rowIndex ? { ...entry, [field]: value } : entry
      )
    );
  }

  function handleAddRow() {
    onChange([...safeQueryParams, { key: '', value: '' }]);
  }

  function handleRemoveRow(rowIndex: number) {
    onChange(safeQueryParams.filter((_, index) => index !== rowIndex));
  }

  return (
    <section className="editor-section">
      <div className="editor-section__header">
        <span className="field-group__label">Query Params</span>
        <button
          className="action-button"
          onClick={handleAddRow}
          type="button"
        >
          Add
        </button>
      </div>

      {safeQueryParams.length === 0 ? (
        <div className="editor-section__empty">No query parameters.</div>
      ) : null}

      <div className="key-value-list">
        {safeQueryParams.map((entry, index) => (
          <div className="key-value-row" key={`query-param-${index}`}>
            <input
              className="field-input"
              placeholder="Key"
              value={entry.key}
              onChange={(event) =>
                handleRowChange(index, 'key', event.target.value)
              }
            />
            <input
              className="field-input"
              placeholder="Value"
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
