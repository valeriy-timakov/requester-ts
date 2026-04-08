import type { RequestOptions } from '@/shared/types/requester';

interface RequestOptionsEditorProps {
  requestOptions: RequestOptions;
  onChange: (requestOptions: RequestOptions) => void;
}

export function RequestOptionsEditor({
  requestOptions,
  onChange
}: RequestOptionsEditorProps) {
  return (
    <section className="editor-section">
      <label className="checkbox-field">
        <input
          checked={requestOptions.followRedirects}
          onChange={(event) =>
            onChange({
              ...requestOptions,
              followRedirects: event.target.checked
            })
          }
          type="checkbox"
        />
        <span>Follow redirects</span>
      </label>
    </section>
  );
}
