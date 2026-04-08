import type {
  KeyValueEntry,
  RequestExecutionResponse,
  RequestFile
} from '../../src/shared/types/requester';

const REQUEST_TIMEOUT_MS = 30_000;
const MAX_RESPONSE_BODY_BYTES = 5 * 1024 * 1024;

function isEnabled(entry: KeyValueEntry): boolean {
  return entry.enabled !== false;
}

function normalizeTimeoutMs(timeoutMs: unknown): number {
  if (typeof timeoutMs !== 'number' || !Number.isFinite(timeoutMs) || timeoutMs <= 0) {
    return REQUEST_TIMEOUT_MS;
  }

  return timeoutMs;
}

function buildRequestUrl(request: RequestFile): string {
  const baseUrl = request.url.trim();
  if (!baseUrl) {
    throw new Error('URL is required.');
  }

  let url: URL;

  try {
    url = new URL(baseUrl);
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

  // Auth settings have explicit precedence and overwrite manual Authorization.
  if (request.auth.type === 'bearer') {
    headers.set('authorization', `Bearer ${request.auth.token}`);
  }

  if (request.auth.type === 'basic') {
    const encodedCredentials = Buffer.from(
      `${request.auth.username}:${request.auth.password}`
    ).toString('base64');
    headers.set('authorization', `Basic ${encodedCredentials}`);
  }

  if (!headers.has('content-type')) {
    if (request.body.type === 'json') {
      headers.set('content-type', 'application/json');
    } else if (request.body.type === 'xml') {
      headers.set('content-type', 'application/xml');
    } else if (request.body.type === 'text') {
      headers.set('content-type', 'text/plain');
    }
  }

  return headers;
}

function buildRequestBody(request: RequestFile): BodyInit | undefined {
  if (request.method === 'GET' || request.method === 'HEAD') {
    return undefined;
  }

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

async function readResponseBody(response: Response): Promise<string> {
  if (!response.body) {
    return '';
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  const chunks: string[] = [];
  let totalBytes = 0;
  let truncated = false;

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        break;
      }

      totalBytes += value.byteLength;
      if (totalBytes > MAX_RESPONSE_BODY_BYTES) {
        const allowedBytes = value.byteLength - (totalBytes - MAX_RESPONSE_BODY_BYTES);
        if (allowedBytes > 0) {
          chunks.push(decoder.decode(value.subarray(0, allowedBytes), { stream: true }));
        }
        truncated = true;
        await reader.cancel();
        break;
      }

      chunks.push(decoder.decode(value, { stream: true }));
    }
  } catch {
    return '[Response body could not be read]';
  }

  chunks.push(decoder.decode());
  if (truncated) {
    chunks.push(
      `\n\n[Response body truncated at ${MAX_RESPONSE_BODY_BYTES} bytes to avoid UI instability.]`
    );
  }

  return chunks.join('');
}

export async function executeRequest(
  request: RequestFile
): Promise<RequestExecutionResponse> {
  const startAt = Date.now();
  const timeoutMs = normalizeTimeoutMs(request.requestOptions.timeoutMs);
  const abortController = new AbortController();
  const timeoutId = setTimeout(() => abortController.abort(), timeoutMs);

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

    const body = await readResponseBody(response);
    const contentType = response.headers.get('content-type') ?? undefined;

    return {
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders,
      body,
      durationMs: Date.now() - startAt,
      contentType,
      bodySizeBytes: new TextEncoder().encode(body).byteLength
    };
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error(`Request timed out after ${timeoutMs}ms.`);
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
