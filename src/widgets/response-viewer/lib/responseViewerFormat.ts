import type { RequestExecutionResponse } from '@/shared/types/requester';

const JSON_CONTENT_TYPE_PATTERN = /(^|\+|\/)json($|;)/i;

export interface PreparedBody {
  text: string;
  isJson: boolean;
}

export function getHeaderEntries(
  headers: Record<string, string>
): Array<[string, string]> {
  return Object.entries(headers).sort(([leftKey], [rightKey]) =>
    leftKey.localeCompare(rightKey, undefined, { sensitivity: 'base' })
  );
}

export function headersToText(entries: Array<[string, string]>): string {
  return entries.map(([key, value]) => `${key}: ${value}`).join('\n');
}

export function getHeaderValue(
  headers: Record<string, string>,
  headerName: string
): string | null {
  const targetName = headerName.toLowerCase();

  for (const [key, value] of Object.entries(headers)) {
    if (key.toLowerCase() === targetName) {
      return value;
    }
  }

  return null;
}

export function resolveContentType(response: RequestExecutionResponse): string | null {
  return (
    response.contentType ?? getHeaderValue(response.headers, 'content-type') ?? null
  );
}

export function getBodySizeBytes(response: RequestExecutionResponse): number {
  if (
    typeof response.bodySizeBytes === 'number' &&
    Number.isFinite(response.bodySizeBytes) &&
    response.bodySizeBytes >= 0
  ) {
    return response.bodySizeBytes;
  }

  return new TextEncoder().encode(response.body ?? '').byteLength;
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`;
  }

  const units = ['KB', 'MB', 'GB'];
  let value = bytes / 1024;
  let index = 0;

  while (value >= 1024 && index < units.length - 1) {
    value /= 1024;
    index += 1;
  }

  const precision = value >= 10 ? 0 : 1;
  return `${value.toFixed(precision)} ${units[index]}`;
}

function isJsonContentType(contentType: string | null): boolean {
  if (!contentType) {
    return false;
  }

  return JSON_CONTENT_TYPE_PATTERN.test(contentType);
}

function looksLikeJsonText(text: string): boolean {
  const trimmed = text.trimStart();
  return trimmed.startsWith('{') || trimmed.startsWith('[');
}

export function prepareBodyText(
  body: string,
  contentType: string | null
): PreparedBody {
  const shouldTryParse = isJsonContentType(contentType) || looksLikeJsonText(body);

  if (!shouldTryParse) {
    return {
      text: body,
      isJson: false
    };
  }

  try {
    const parsed = JSON.parse(body);
    return {
      text: JSON.stringify(parsed, null, 2),
      isJson: true
    };
  } catch {
    return {
      text: body,
      isJson: false
    };
  }
}
