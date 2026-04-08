import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { RequestExecutionResponse } from '@/shared/types/requester';
import { ResponseViewer } from './ResponseViewer';

function createResponse(
  overrides: Partial<RequestExecutionResponse> = {}
): RequestExecutionResponse {
  return {
    status: 200,
    statusText: 'OK',
    headers: {
      'content-type': 'application/json'
    },
    body: '{"ok":true}',
    durationMs: 123,
    ...overrides
  };
}

function mockClipboard(writeText: (text: string) => Promise<void>) {
  Object.defineProperty(navigator, 'clipboard', {
    configurable: true,
    value: {
      writeText
    }
  });
}

describe('ResponseViewer', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it('shows placeholder when no response exists', () => {
    render(<ResponseViewer response={null} isLoading={false} error={null} />);

    expect(screen.getByText('No response yet')).not.toBeNull();
  });

  it('shows loading and error states', () => {
    const { rerender } = render(
      <ResponseViewer response={null} isLoading={true} error={null} />
    );

    expect(screen.getByText('Sending request...')).not.toBeNull();

    rerender(
      <ResponseViewer
        response={null}
        isLoading={false}
        error={'Request failed.'}
      />
    );

    expect(screen.getByText('Request failed.')).not.toBeNull();
  });

  it('shows summary details including content type and body size', () => {
    render(
      <ResponseViewer
        response={createResponse({
          body: 'hello',
          durationMs: 45,
          headers: {
            'content-type': 'text/plain'
          }
        })}
        isLoading={false}
        error={null}
      />
    );

    expect(screen.getByText('200 OK')).not.toBeNull();
    expect(screen.getByText('45 ms')).not.toBeNull();
    expect(screen.getByText('text/plain')).not.toBeNull();
    expect(screen.getByText('5 B')).not.toBeNull();
  });

  it('pretty prints json body and keeps stable sorted headers', () => {
    render(
      <ResponseViewer
        response={createResponse({
          headers: {
            'x-zebra': 'z',
            'content-type': 'application/json',
            'x-alpha': 'a'
          },
          body: '{"b":2,"a":1}'
        })}
        isLoading={false}
        error={null}
      />
    );

    expect(screen.getByText('Body (JSON)')).not.toBeNull();
    const prettyBody = screen.getByText(
      (_, element) =>
        element?.tagName === 'PRE' &&
        (element.textContent?.includes('"a": 1') ?? false) &&
        (element.textContent?.includes('"b": 2') ?? false)
    );
    expect(prettyBody).not.toBeNull();

    const headersBlock = screen.getByText(/content-type: application\/json/i);
    const headersText = headersBlock.textContent ?? '';
    expect(headersText.indexOf('content-type: application/json')).toBeLessThan(
      headersText.indexOf('x-alpha: a')
    );
    expect(headersText.indexOf('x-alpha: a')).toBeLessThan(
      headersText.indexOf('x-zebra: z')
    );
  });

  it('falls back to raw text when json parsing fails', () => {
    render(
      <ResponseViewer
        response={createResponse({
          headers: {
            'content-type': 'application/json'
          },
          body: '{invalid json'
        })}
        isLoading={false}
        error={null}
      />
    );

    expect(screen.getByText('{invalid json')).not.toBeNull();
  });

  it('copies headers and body text to clipboard', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    mockClipboard(writeText);

    render(
      <ResponseViewer
        response={createResponse({
          headers: {
            'x-a': '1',
            'x-b': '2'
          },
          body: 'plain body'
        })}
        isLoading={false}
        error={null}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: 'Copy headers' }));
    fireEvent.click(screen.getByRole('button', { name: 'Copy body' }));

    await waitFor(() => {
      expect(writeText).toHaveBeenCalledWith('x-a: 1\nx-b: 2');
      expect(writeText).toHaveBeenCalledWith('plain body');
    });
  });

  it('renders empty body placeholder and allows copying empty body', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    mockClipboard(writeText);

    render(
      <ResponseViewer
        response={createResponse({
          body: '',
          headers: {}
        })}
        isLoading={false}
        error={null}
      />
    );

    expect(screen.getByText('(empty body)')).not.toBeNull();

    fireEvent.click(screen.getByRole('button', { name: 'Copy body' }));

    await waitFor(() => {
      expect(writeText).toHaveBeenCalledWith('');
    });
  });
});
