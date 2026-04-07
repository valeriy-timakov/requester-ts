import { mkdir, readFile, writeFile } from 'fs/promises';
import path from 'path';
import type { RequestFile } from '../../src/shared/types/requester';

const INVALID_FILE_NAME_PATTERN = /[<>:"/\\|?*\u0000-\u001F]/;
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

export const DEFAULT_REQUEST_NAME = 'New Request';

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
    requestOptions: { followRedirects: true }
  };
}

export function validateEntryName(name: string): string {
  const normalizedName = name.trim();

  if (!normalizedName) {
    throw new Error('Name cannot be empty.');
  }

  if (normalizedName === '.' || normalizedName === '..') {
    throw new Error('Name is not valid.');
  }

  if (INVALID_FILE_NAME_PATTERN.test(normalizedName)) {
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

export async function readRequestFile(filePath: string): Promise<RequestFile> {
  const content = await readFile(filePath, 'utf8');
  const parsed = JSON.parse(content) as RequestFile;

  if (!parsed || typeof parsed !== 'object') {
    throw new Error('Request file is invalid.');
  }

  return parsed;
}

export async function saveRequestFile(
  filePath: string,
  requestFile: RequestFile
): Promise<void> {
  const normalizedRequest = {
    ...requestFile,
    version: 1,
    name: validateEntryName(requestFile.name)
  } satisfies RequestFile;

  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, JSON.stringify(normalizedRequest, null, 2), 'utf8');
}
