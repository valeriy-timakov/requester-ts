import type { RequestBody } from '@/shared/types/requester';

interface BodyEditorProps {
  body: RequestBody;
  onChange: (body: RequestBody) => void;
}

type RawBodyType = 'text' | 'json' | 'xml';

function getRawBodyType(body: RequestBody): RawBodyType {
  if (body.type === 'json' || body.type === 'xml') {
    return body.type;
  }

  return 'text';
}

function getRawBodyContent(body: RequestBody): string {
  if (body.type === 'text' || body.type === 'json' || body.type === 'xml') {
    return body.content;
  }

  return '';
}

export function BodyEditor({ body, onChange }: BodyEditorProps) {
  const bodyMode = body.type === 'none' ? 'none' : 'raw';
  const rawBodyType = getRawBodyType(body);

  function handleBodyModeChange(mode: 'none' | 'raw') {
    if (mode === 'none') {
      onChange({ type: 'none' });
      return;
    }

    onChange({
      type: rawBodyType,
      content: getRawBodyContent(body)
    });
  }

  function handleRawBodyTypeChange(type: RawBodyType) {
    onChange({
      type,
      content: getRawBodyContent(body)
    });
  }

  return (
    <section className="editor-section">
      <div className="editor-grid editor-grid--two">
        <label className="field-group field-group--compact">
          <span className="field-group__label">Body</span>
          <select
            className="field-input"
            value={bodyMode}
            onChange={(event) =>
              handleBodyModeChange(event.target.value as 'none' | 'raw')
            }
          >
            <option value="none">None</option>
            <option value="raw">Raw</option>
          </select>
        </label>

        {bodyMode === 'raw' ? (
          <label className="field-group field-group--compact">
            <span className="field-group__label">Raw Type</span>
            <select
              className="field-input"
              value={rawBodyType}
              onChange={(event) =>
                handleRawBodyTypeChange(event.target.value as RawBodyType)
              }
            >
              <option value="text">text/plain</option>
              <option value="json">application/json</option>
              <option value="xml">application/xml</option>
            </select>
          </label>
        ) : null}
      </div>

      {bodyMode === 'raw' ? (
        <label className="field-group">
          <span className="field-group__label">Content</span>
          <textarea
            className="field-input field-input--textarea"
            value={getRawBodyContent(body)}
            onChange={(event) =>
              onChange({
                type: rawBodyType,
                content: event.target.value
              })
            }
          />
        </label>
      ) : null}
    </section>
  );
}
