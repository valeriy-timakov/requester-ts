import type { RequestExecutionResponse } from '@/shared/types/requester';

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
        <div className="inline-error">{error}</div>
      </section>
    );
  }

  if (!response) {
    return (
      <section className="response-panel">
        <div className="workspace__label">Response</div>
        <div className="workspace__placeholder">Send a request to see response.</div>
      </section>
    );
  }

  return (
    <section className="response-panel">
      <div className="workspace__label">Response</div>
      <div className="response-meta">
        <span>Status: {response.status}</span>
        <span>{response.statusText || 'No status text'}</span>
        <span>Time: {response.durationMs} ms</span>
      </div>

      <details className="response-headers">
        <summary>Headers ({Object.keys(response.headers).length})</summary>
        <pre className="response-pre">
          {Object.entries(response.headers)
            .map(([key, value]) => `${key}: ${value}`)
            .join('\n') || '(none)'}
        </pre>
      </details>

      <div className="response-body">
        <div className="response-body__label">Body</div>
        <pre className="response-pre">{response.body || '(empty)'}</pre>
      </div>
    </section>
  );
}
