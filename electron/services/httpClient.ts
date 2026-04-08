import type {
  KeyValueEntry,
  RequestExecutionResponse,
  RequestFile
} from '../../src/shared/types/requester';

const REQUEST_TIMEOUT_MS = 30_000;

function isEnabled(entry: KeyValueEntry): boolean {
  return entry.enabled !== false;
}

function buildRequestUrl(request: RequestFile): string {
  let url: URL;

  try {
    url = new URL(request.url);
  } catch {
    throw new Error('Invalid URL.');
  }

  for (const queryParam of request.queryParams) {
    if (!isEnabled(queryParam) || !queryParam.key.trim()) {
      continue;
    }

    url.searchParams.append(queryParam.key, queryParam.value);
  }

  return url.toString();
}

function buildRequestHeaders(request: RequestFile): Headers {
  const headers = new Headers();

  for (const header of request.headers) {
    if (!isEnabled(header) || !header.key.trim()) {
      continue;
    }

    headers.set(header.key, header.value);
  }

  if (request.auth.type === 'bearer' && request.auth.token.trim()) {
    headers.set('authorization', `Bearer ${request.auth.token}`);
  }

  if (request.auth.type === 'basic') {
    const encodedCredentials = Buffer.from(
      `${request.auth.username}:${request.auth.password}`
    ).toString('base64');
    headers.set('authorization', `Basic ${encodedCredentials}`);
  }

  return headers;
}

function buildRequestBody(request: RequestFile): BodyInit | undefined {
  if (request.body.type === 'none') {
    return undefined;
  }

  if (
    request.body.type === 'text' ||
    request.body.type === 'json' ||
    request.body.type === 'xml'
  ) {
    return request.body.content;
  }

  throw new Error('Only "none" and raw text request bodies are supported.');
}

export async function executeRequest(
  request: RequestFile
): Promise<RequestExecutionResponse> {
  const startAt = Date.now();
  const abortController = new AbortController();
  const timeoutId = setTimeout(() => abortController.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(buildRequestUrl(request), {
      method: request.method,
      headers: buildRequestHeaders(request),
      body: buildRequestBody(request),
      redirect: request.requestOptions.followRedirects ? 'follow' : 'manual',
      signal: abortController.signal
    });

    const responseHeaders: Record<string, string> = {};
    for (const [key, value] of response.headers.entries()) {
      responseHeaders[key] = value;
    }

    return {
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders,
      body: await response.text(),
      durationMs: Date.now() - startAt
    };
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error(`Request timed out after ${REQUEST_TIMEOUT_MS}ms.`);
    }

    throw new Error(
      error instanceof Error && error.message
        ? `Request failed: ${error.message}`
        : 'Request failed.'
    );
  } finally {
    clearTimeout(timeoutId);
  }
}
