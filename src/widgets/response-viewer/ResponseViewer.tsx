import { useMemo, useState } from 'react';
import type { RequestExecutionResponse } from '@/shared/types/requester';
import {
  formatBytes,
  getBodySizeBytes,
  getHeaderEntries,
  headersToText,
  prepareBodyText,
  resolveContentType
} from './lib/responseViewerFormat';

interface ResponseViewerProps {
  response: RequestExecutionResponse | null;
  isLoading: boolean;
  error: string | null;
}

export function ResponseViewer({
  response,
  isLoading,
  error
}: ResponseViewerProps) {
  const [copyStatus, setCopyStatus] = useState<string | null>(null);

  const responseDetails = useMemo(() => {
    if (!response) {
      return null;
    }

    const headerEntries = getHeaderEntries(response.headers);
    const headersText = headersToText(headerEntries);
    const contentType = resolveContentType(response);
    const bodySizeBytes = getBodySizeBytes(response);
    const preparedBody = prepareBodyText(response.body ?? '', contentType);

    return {
      headerEntries,
      headersText,
      contentType,
      bodySizeBytes,
      preparedBody
    };
  }, [response]);

  async function copyToClipboard(label: 'Body' | 'Headers', text: string) {
    try {
      if (!navigator.clipboard?.writeText) {
        throw new Error('Clipboard API is unavailable.');
      }

      await navigator.clipboard.writeText(text);
      setCopyStatus(`${label} copied`);
    } catch {
      setCopyStatus(`Failed to copy ${label.toLowerCase()}`);
    }
  }

  if (isLoading) {
    return (
      <section className="response-panel">
        <div className="workspace__label">Response</div>
        <div className="workspace__placeholder">Sending request...</div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="response-panel">
        <div className="workspace__label">Response</div>
        <div className="inline-error response-panel__error">{error}</div>
      </section>
    );
  }

  if (!response || !responseDetails) {
    return (
      <section className="response-panel">
        <div className="workspace__label">Response</div>
        <div className="workspace__placeholder">No response yet</div>
      </section>
    );
  }

  const { headerEntries, headersText, contentType, bodySizeBytes, preparedBody } =
    responseDetails;
  const bodyText = preparedBody.text;
  const hasBody = bodyText.length > 0;
  const statusLine = response.statusText
    ? `${response.status} ${response.statusText}`
    : String(response.status);

  return (
    <section className="response-panel">
      <div className="workspace__label">Response</div>

      <div className="response-summary" aria-label="Response summary">
        <div className="response-summary__item">
          <span className="response-summary__label">Status</span>
          <span className="response-summary__value">{statusLine}</span>
        </div>
        <div className="response-summary__item">
          <span className="response-summary__label">Duration</span>
          <span className="response-summary__value">{response.durationMs} ms</span>
        </div>
        <div className="response-summary__item">
          <span className="response-summary__label">Content-Type</span>
          <span className="response-summary__value">{contentType ?? 'Unknown'}</span>
        </div>
        <div className="response-summary__item">
          <span className="response-summary__label">Size</span>
          <span className="response-summary__value">{formatBytes(bodySizeBytes)}</span>
        </div>
      </div>

      <details className="response-headers" open>
        <summary>Headers ({headerEntries.length})</summary>
        <div className="response-section__actions">
          <button
            className="action-button"
            onClick={() => {
              void copyToClipboard('Headers', headersText);
            }}
            type="button"
          >
            Copy headers
          </button>
        </div>
        <pre className="response-pre">
          {headersText || '(none)'}
        </pre>
      </details>

      <div className="response-body">
        <div className="response-body__header">
          <div className="response-body__label">
            Body{preparedBody.isJson ? ' (JSON)' : ''}
          </div>
          <button
            className="action-button"
            onClick={() => {
              void copyToClipboard('Body', bodyText);
            }}
            type="button"
          >
            Copy body
          </button>
        </div>

        {hasBody ? (
          <pre className="response-pre response-pre--body">{bodyText}</pre>
        ) : (
          <div className="workspace__placeholder response-empty-body">(empty body)</div>
        )}
      </div>

      {copyStatus ? <div className="response-copy-status">{copyStatus}</div> : null}
    </section>
  );
}
