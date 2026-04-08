import { access, copyFile, mkdir, readFile, rm, stat, writeFile } from 'fs/promises';
import path from 'path';
import {
  DEFAULT_REQUEST_NAME,
  DEFAULT_REQUEST_TIMEOUT_MS,
  InvalidRequestFileError,
  normalizeRequestFile,
  parseRequestFileContent,
  toCanonicalRequestFile
} from '../../src/shared/requestNormalization';
import { normalizeResponseFile } from '../../src/shared/responseNormalization';
import type {
  RequestExecutionResponse,
  RequestFile,
  RequestReadResult
} from '../../src/shared/types/requester';

const INVALID_FILE_NAME_PATTERN = /[<>:"/\\|?*]/;
const RESERVED_FILE_NAMES = new Set([
  'CON',
  'PRN',
  'AUX',
  'NUL',
  'COM1',
  'COM2',
  'COM3',
  'COM4',
  'COM5',
  'COM6',
  'COM7',
  'COM8',
  'COM9',
  'LPT1',
  'LPT2',
  'LPT3',
  'LPT4',
  'LPT5',
  'LPT6',
  'LPT7',
  'LPT8',
  'LPT9'
]);

export { DEFAULT_REQUEST_NAME };

function resolveRequestFallbackName(filePath: string): string {
  const fileName = path.basename(filePath, path.extname(filePath)).trim();
  return fileName || DEFAULT_REQUEST_NAME;
}

export function createDefaultRequest(name = DEFAULT_REQUEST_NAME): RequestFile {
  return {
    version: 1,
    name,
    method: 'GET',
    url: '',
    queryParams: [],
    headers: [],
    auth: { type: 'none' },
    body: { type: 'none' },
    requestOptions: { followRedirects: true, timeoutMs: DEFAULT_REQUEST_TIMEOUT_MS },
    attachments: []
  };
}

function normalizeAttachmentFileName(fileName: string): string {
  const normalized = fileName.trim();

  if (!normalized) {
    throw new Error('Attachment file name is invalid.');
  }

  if (normalized.includes('/') || normalized.includes('\\')) {
    throw new Error('Attachment file name must not contain path separators.');
  }

  if (normalized === '.' || normalized === '..') {
    throw new Error('Attachment file name is invalid.');
  }

  return normalized;
}

function normalizeAttachmentRelativePath(relativePath: string): string {
  const normalized = relativePath.trim();

  if (!normalized) {
    throw new Error('Attachment path is invalid.');
  }

  if (normalized.includes('/')) {
    if (!normalized.startsWith('./') || normalized.slice(2).includes('/')) {
      throw new Error('Only local attachment files are supported.');
    }
  }

  if (normalized.includes('\\')) {
    throw new Error('Only local attachment files are supported.');
  }

  const fileName = normalized.startsWith('./') ? normalized.slice(2) : normalized;
  return normalizeAttachmentFileName(fileName);
}

async function pathExists(entryPath: string): Promise<boolean> {
  try {
    await access(entryPath);
    return true;
  } catch {
    return false;
  }
}

async function resolveUniqueAttachmentFileName(
  requestFolderPath: string,
  desiredFileName: string
): Promise<string> {
  const parsed = path.parse(desiredFileName);
  const baseName = parsed.name;
  const extension = parsed.ext;

  let candidate = desiredFileName;
  let index = 1;

  while (await pathExists(path.join(requestFolderPath, candidate))) {
    candidate = `${baseName} (${index})${extension}`;
    index += 1;
  }

  return candidate;
}

export function validateEntryName(name: string): string {
  const normalizedName = name.trim();

  if (!normalizedName) {
    throw new Error('Name cannot be empty.');
  }

  if (normalizedName === '.' || normalizedName === '..') {
    throw new Error('Name is not valid.');
  }

  const hasControlChars = [...normalizedName].some(
    (char) => char.charCodeAt(0) <= 31
  );
  if (INVALID_FILE_NAME_PATTERN.test(normalizedName) || hasControlChars) {
    throw new Error('Name contains invalid filename characters.');
  }

  if (normalizedName.endsWith('.')) {
    throw new Error('Name cannot end with a dot.');
  }

  if (normalizedName.endsWith(' ')) {
    throw new Error('Name cannot end with a space.');
  }

  if (RESERVED_FILE_NAMES.has(normalizedName.toUpperCase())) {
    throw new Error('Name is reserved by the operating system.');
  }

  return normalizedName;
}

export function getRequestFilePath(parentPath: string, name: string): string {
  return path.join(parentPath, `${validateEntryName(name)}.req`);
}

export function getResponseFilePath(requestPath: string): string {
  return requestPath.replace(/\.req$/i, '.resp');
}

export async function readRequestFile(filePath: string): Promise<RequestFile> {
  const content = await readFile(filePath, 'utf8');
  const parsed = parseRequestFileContent(content);
  return normalizeRequestFile(parsed, resolveRequestFallbackName(filePath));
}

export async function readResponseFile(
  requestPath: string
): Promise<RequestExecutionResponse | null> {
  const responsePath = getResponseFilePath(requestPath);
  let responseContent: string;

  try {
    responseContent = await readFile(responsePath, 'utf8');
  } catch (error) {
    if ((error as NodeJS.ErrnoException)?.code === 'ENOENT') {
      return null;
    }

    throw error;
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(responseContent) as unknown;
  } catch (error) {
    console.warn(`Ignoring invalid response file at ${responsePath}.`, error);
    return null;
  }

  const normalized = normalizeResponseFile(parsed);
  if (!normalized) {
    console.warn(`Ignoring invalid response file at ${responsePath}.`);
    return null;
  }

  return normalized;
}

export async function readRequestDocument(filePath: string): Promise<RequestReadResult> {
  try {
    const request = await readRequestFile(filePath);
    const lastResponse = await readResponseFile(filePath);
    return {
      ok: true,
      document: {
        path: filePath,
        data: request,
        lastResponse
      }
    };
  } catch (error) {
    if (error instanceof InvalidRequestFileError) {
      return {
        ok: false,
        error: error.toSerializable()
      };
    }

    throw error;
  }
}

export async function saveRequestFile(
  filePath: string,
  requestFile: RequestFile
): Promise<void> {
  const normalizedRequest = normalizeRequestFile(requestFile, DEFAULT_REQUEST_NAME);
  const canonicalRequest = toCanonicalRequestFile({
    ...normalizedRequest,
    name: validateEntryName(normalizedRequest.name)
  });

  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, JSON.stringify(canonicalRequest, null, 2), 'utf8');
}

export async function addAttachmentToRequestFile(
  requestFilePath: string,
  sourceFilePath: string
): Promise<RequestFile> {
  const sourceStats = await stat(sourceFilePath);
  if (!sourceStats.isFile()) {
    throw new Error('Attachment source must be a file.');
  }

  const request = await readRequestFile(requestFilePath);
  const requestFolderPath = path.dirname(requestFilePath);
  const sourceFileName = normalizeAttachmentFileName(path.basename(sourceFilePath));
  const targetFileName = await resolveUniqueAttachmentFileName(
    requestFolderPath,
    sourceFileName
  );
  const targetFilePath = path.join(requestFolderPath, targetFileName);

  await copyFile(sourceFilePath, targetFilePath);

  const nextRequest: RequestFile = {
    ...request,
    attachments: [
      ...(request.attachments ?? []),
      {
        fileName: targetFileName,
        relativePath: `./${targetFileName}`,
        size: sourceStats.size
      }
    ]
  };
  await saveRequestFile(requestFilePath, nextRequest);

  return readRequestFile(requestFilePath);
}

export async function removeAttachmentFromRequestFile(
  requestFilePath: string,
  attachmentRelativePath: string
): Promise<RequestFile> {
  const request = await readRequestFile(requestFilePath);
  const attachmentFileName = normalizeAttachmentRelativePath(
    attachmentRelativePath
  );
  const normalizedTargetRelativePath = `./${attachmentFileName}`;

  const filteredAttachments = (request.attachments ?? []).filter(
    (attachment) => {
      try {
        return (
          normalizeAttachmentRelativePath(attachment.relativePath) !==
          attachmentFileName
        );
      } catch {
        return true;
      }
    }
  );
  const nextRequest: RequestFile = {
    ...request,
    attachments: filteredAttachments
  };

  await saveRequestFile(requestFilePath, nextRequest);

  const targetAttachmentPath = path.join(
    path.dirname(requestFilePath),
    attachmentFileName
  );
  try {
    const currentStats = await stat(targetAttachmentPath);
    if (currentStats.isFile()) {
      const stillUsed = filteredAttachments.some(
        (attachment) => attachment.relativePath === normalizedTargetRelativePath
      );
      if (!stillUsed) {
        await rm(targetAttachmentPath, { force: true });
      }
    }
  } catch {
    // Missing file or stat failure is non-fatal for metadata removal.
  }

  return readRequestFile(requestFilePath);
}

export async function saveResponseFile(
  requestPath: string,
  response: RequestExecutionResponse
): Promise<void> {
  const responsePath = getResponseFilePath(requestPath);
  const normalizedResponse = normalizeResponseFile(response) ?? {
    status: 0,
    statusText: '',
    headers: {},
    body: '',
    durationMs: 0
  };

  await mkdir(path.dirname(responsePath), { recursive: true });
  await writeFile(responsePath, JSON.stringify(normalizedResponse, null, 2), 'utf8');
}
