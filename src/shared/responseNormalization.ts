import type { RequestExecutionResponse } from './types/requester';

function toFiniteNumber(value: unknown, fallback: number): number {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  return fallback;
}

function normalizeHeaders(headers: unknown): Record<string, string> {
  if (!headers || typeof headers !== 'object' || Array.isArray(headers)) {
    return {};
  }

  const result: Record<string, string> = {};
  for (const [key, value] of Object.entries(headers as Record<string, unknown>)) {
    if (typeof value === 'string') {
      result[key] = value;
      continue;
    }

    if (typeof value === 'number' || typeof value === 'boolean') {
      result[key] = String(value);
    }
  }

  return result;
}

export function normalizeResponseFile(
  source: unknown
): RequestExecutionResponse | null {
  if (!source || typeof source !== 'object' || Array.isArray(source)) {
    return null;
  }

  const record = source as Record<string, unknown>;

  return {
    status: toFiniteNumber(record.status, 0),
    statusText: typeof record.statusText === 'string' ? record.statusText : '',
    headers: normalizeHeaders(record.headers),
    body: typeof record.body === 'string' ? record.body : String(record.body ?? ''),
    durationMs: toFiniteNumber(record.durationMs, 0),
    ...(typeof record.contentType === 'string'
      ? { contentType: record.contentType }
      : {}),
    ...(typeof record.bodySizeBytes === 'number' &&
    Number.isFinite(record.bodySizeBytes) &&
    record.bodySizeBytes >= 0
      ? { bodySizeBytes: record.bodySizeBytes }
      : {})
  };
}
