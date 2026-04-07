import { access, mkdir, rename, rm, stat } from 'fs/promises';
import path from 'path';
import {
  createDefaultRequest,
  getRequestFilePath,
  validateEntryName
} from './requestFileService';
import { saveRequestFile } from './requestFileService';

async function pathExists(entryPath: string): Promise<boolean> {
  try {
    await access(entryPath);
    return true;
  } catch {
    return false;
  }
}

async function ensureDoesNotExist(entryPath: string): Promise<void> {
  if (await pathExists(entryPath)) {
    throw new Error('An entry with that name already exists.');
  }
}

function getResponseFilePath(requestPath: string): string {
  return requestPath.replace(/\.req$/i, '.resp');
}

async function deleteRequestArtifacts(requestPath: string): Promise<void> {
  await rm(requestPath, { force: true });
  await rm(getResponseFilePath(requestPath), { force: true });
}

export async function createFolder(
  parentPath: string,
  name: string
): Promise<void> {
  const nextPath = path.join(parentPath, validateEntryName(name));
  await ensureDoesNotExist(nextPath);
  await mkdir(nextPath);
}

export async function createRequest(
  parentPath: string,
  name: string
): Promise<string> {
  const normalizedName = validateEntryName(name);
  const requestPath = getRequestFilePath(parentPath, normalizedName);
  await ensureDoesNotExist(requestPath);
  await saveRequestFile(requestPath, createDefaultRequest(normalizedName));
  return requestPath;
}

export async function renameEntry(
  entryPath: string,
  nextName: string
): Promise<string> {
  const normalizedName = validateEntryName(nextName);
  const entryStats = await stat(entryPath);

  if (entryStats.isDirectory()) {
    const nextPath = path.join(path.dirname(entryPath), normalizedName);
    await ensureDoesNotExist(nextPath);
    await rename(entryPath, nextPath);
    return nextPath;
  }

  if (path.extname(entryPath) !== '.req') {
    throw new Error('Only folders and request files can be renamed.');
  }

  const nextRequestPath = getRequestFilePath(
    path.dirname(entryPath),
    normalizedName
  );
  await ensureDoesNotExist(nextRequestPath);
  await rename(entryPath, nextRequestPath);

  const currentResponsePath = getResponseFilePath(entryPath);
  const nextResponsePath = getResponseFilePath(nextRequestPath);

  if (await pathExists(currentResponsePath)) {
    await rename(currentResponsePath, nextResponsePath);
  }

  return nextRequestPath;
}

export async function deleteEntry(entryPath: string): Promise<void> {
  const entryStats = await stat(entryPath);

  if (entryStats.isDirectory()) {
    await rm(entryPath, { recursive: true, force: true });
    return;
  }

  if (path.extname(entryPath) !== '.req') {
    throw new Error('Only folders and request files can be deleted.');
  }

  await deleteRequestArtifacts(entryPath);
}
