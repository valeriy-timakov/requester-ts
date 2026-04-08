import type {
  HttpMethod,
  KeyValueEntry,
  RequestAttachment,
  RequestAuth,
  RequestBody,
  RequestFile
} from './types/requester';

const HTTP_METHODS: HttpMethod[] = [
  'GET',
  'POST',
  'PUT',
  'PATCH',
  'DELETE',
  'HEAD',
  'OPTIONS'
];

export const REQUEST_FILE_VERSION = 1;
export const DEFAULT_REQUEST_NAME = 'New Request';
export const DEFAULT_REQUEST_TIMEOUT_MS = 30_000;

export interface RequestNormalizationError {
  code: 'INVALID_REQUEST_FILE';
  message: string;
}

export class InvalidRequestFileError extends Error {
  readonly code = 'INVALID_REQUEST_FILE';

  constructor(message: string) {
    super(message);
    this.name = 'InvalidRequestFileError';
  }

  toSerializable(): RequestNormalizationError {
    return {
      code: this.code,
      message: this.message
    };
  }
}

function normalizeMethod(method: unknown): HttpMethod {
  if (typeof method !== 'string') {
    return 'GET';
  }

  const normalizedMethod = method.toUpperCase() as HttpMethod;
  if (HTTP_METHODS.includes(normalizedMethod)) {
    return normalizedMethod;
  }

  return 'GET';
}

function normalizeEntries(entries: unknown): KeyValueEntry[] {
  if (!Array.isArray(entries)) {
    return [];
  }

  return entries
    .map((entry) => {
      if (!entry || typeof entry !== 'object') {
        return null;
      }

      const candidate = entry as Partial<KeyValueEntry>;
      return {
        key: typeof candidate.key === 'string' ? candidate.key : '',
        value: typeof candidate.value === 'string' ? candidate.value : '',
        ...(typeof candidate.enabled === 'boolean'
          ? { enabled: candidate.enabled }
          : {})
      };
    })
    .filter((entry): entry is KeyValueEntry => entry !== null);
}

function normalizeAuth(auth: unknown): RequestAuth {
  if (!auth || typeof auth !== 'object') {
    return { type: 'none' };
  }

  const candidate = auth as Partial<RequestAuth>;

  if (candidate.type === 'basic') {
    return {
      type: 'basic',
      username: typeof candidate.username === 'string' ? candidate.username : '',
      password: typeof candidate.password === 'string' ? candidate.password : ''
    };
  }

  if (candidate.type === 'bearer') {
    return {
      type: 'bearer',
      token: typeof candidate.token === 'string' ? candidate.token : ''
    };
  }

  return { type: 'none' };
}

function normalizeBody(body: unknown): RequestBody {
  if (!body || typeof body !== 'object') {
    return { type: 'none' };
  }

  const candidate = body as Partial<RequestBody>;
  if (
    candidate.type === 'text' ||
    candidate.type === 'json' ||
    candidate.type === 'xml'
  ) {
    return {
      type: candidate.type,
      content: typeof candidate.content === 'string' ? candidate.content : ''
    };
  }

  return { type: 'none' };
}

function normalizeAttachmentFileName(fileName: unknown): string | null {
  if (typeof fileName !== 'string') {
    return null;
  }

  const normalized = fileName.trim();
  if (!normalized) {
    return null;
  }

  if (normalized.includes('/') || normalized.includes('\\')) {
    return null;
  }

  if (normalized === '.' || normalized === '..') {
    return null;
  }

  return normalized;
}

function normalizeAttachmentRelativePath(relativePath: unknown): string | null {
  if (typeof relativePath !== 'string') {
    return null;
  }

  const normalized = relativePath.trim();
  if (!normalized) {
    return null;
  }

  if (normalized.includes('/')) {
    if (!normalized.startsWith('./') || normalized.slice(2).includes('/')) {
      return null;
    }
  }

  if (normalized.includes('\\')) {
    return null;
  }

  const fileName = normalized.startsWith('./') ? normalized.slice(2) : normalized;
  return normalizeAttachmentFileName(fileName);
}

function normalizeAttachments(attachments: unknown): RequestAttachment[] {
  if (!Array.isArray(attachments)) {
    return [];
  }

  const result: RequestAttachment[] = [];
  for (const item of attachments) {
    if (!item || typeof item !== 'object') {
      continue;
    }

    const candidate = item as Partial<RequestAttachment>;
    const fileName =
      normalizeAttachmentFileName(candidate.fileName) ??
      normalizeAttachmentRelativePath(candidate.relativePath);

    if (!fileName) {
      continue;
    }

    const normalizedRelativePath = normalizeAttachmentRelativePath(
      candidate.relativePath
    );
    const size =
      typeof candidate.size === 'number' &&
      Number.isFinite(candidate.size) &&
      candidate.size >= 0
        ? candidate.size
        : 0;

    result.push({
      fileName,
      relativePath: `./${normalizedRelativePath ?? fileName}`,
      size
    });
  }

  return result;
}

function normalizeRootObject(source: unknown): Record<string, unknown> {
  if (!source || typeof source !== 'object' || Array.isArray(source)) {
    throw new InvalidRequestFileError(
      'Invalid request file: expected JSON object'
    );
  }

  return source as Record<string, unknown>;
}

function assertSupportedVersion(version: unknown): void {
  if (typeof version === 'undefined') {
    return;
  }

  if (version !== REQUEST_FILE_VERSION) {
    throw new InvalidRequestFileError(
      'Invalid request file: unsupported version'
    );
  }
}

export function parseRequestFileContent(content: string): unknown {
  try {
    return JSON.parse(content) as unknown;
  } catch {
    throw new InvalidRequestFileError('Invalid request file: malformed JSON');
  }
}

export function normalizeRequestFile(
  source: unknown,
  fallbackName: string
): RequestFile {
  const root = normalizeRootObject(source);
  assertSupportedVersion(root.version);

  const name = typeof root.name === 'string' && root.name.trim()
    ? root.name
    : fallbackName;

  return {
    version: REQUEST_FILE_VERSION,
    name,
    method: normalizeMethod(root.method),
    url: typeof root.url === 'string' ? root.url : '',
    queryParams: normalizeEntries(root.queryParams),
    headers: normalizeEntries(root.headers),
    auth: normalizeAuth(root.auth),
    body: normalizeBody(root.body),
    requestOptions: {
      followRedirects:
        typeof (root.requestOptions as { followRedirects?: unknown } | undefined)
          ?.followRedirects === 'boolean'
          ? (root.requestOptions as { followRedirects: boolean }).followRedirects
          : true,
      timeoutMs:
        typeof (root.requestOptions as { timeoutMs?: unknown } | undefined)
          ?.timeoutMs === 'number' &&
        Number.isFinite((root.requestOptions as { timeoutMs: number }).timeoutMs) &&
        (root.requestOptions as { timeoutMs: number }).timeoutMs > 0
          ? (root.requestOptions as { timeoutMs: number }).timeoutMs
          : DEFAULT_REQUEST_TIMEOUT_MS
    },
    attachments: normalizeAttachments(root.attachments)
  };
}

export function toCanonicalRequestFile(requestFile: RequestFile): RequestFile {
  return {
    version: REQUEST_FILE_VERSION,
    name: requestFile.name,
    method: requestFile.method,
    url: requestFile.url,
    queryParams: requestFile.queryParams,
    headers: requestFile.headers,
    auth: requestFile.auth,
    body: requestFile.body,
    requestOptions: requestFile.requestOptions,
    attachments: requestFile.attachments ?? []
  };
}
