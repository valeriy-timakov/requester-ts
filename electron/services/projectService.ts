import { app } from 'electron';
import { mkdir, stat } from 'fs/promises';
import path from 'path';
import type { AppState } from '../../src/shared/types/requester';
import { readMetadata, updateLastOpenedRootFolder } from './appStateService';

let currentRootFolder: string | null = null;

async function isExistingDirectory(folderPath: string): Promise<boolean> {
  try {
    const folderStats = await stat(folderPath);
    return folderStats.isDirectory();
  } catch {
    return false;
  }
}

function getDefaultRootFolderPath(): string {
  return path.join(app.getPath('home'), 'requester');
}

export async function ensureDefaultRootFolder(): Promise<string> {
  const defaultRootFolder = getDefaultRootFolderPath();
  await mkdir(defaultRootFolder, { recursive: true });
  return defaultRootFolder;
}

export async function resolveInitialRootFolder(): Promise<string> {
  const metadata = await readMetadata();

  if (
    metadata.lastOpenedRootFolder &&
    (await isExistingDirectory(metadata.lastOpenedRootFolder))
  ) {
    currentRootFolder = metadata.lastOpenedRootFolder;
    return currentRootFolder;
  }

  currentRootFolder = await ensureDefaultRootFolder();
  return currentRootFolder;
}

export async function getCurrentRootFolder(): Promise<string> {
  if (currentRootFolder) {
    return currentRootFolder;
  }

  return resolveInitialRootFolder();
}

export async function setRootFolder(folderPath: string): Promise<string> {
  if (!(await isExistingDirectory(folderPath))) {
    throw new Error(`Root folder does not exist: ${folderPath}`);
  }

  currentRootFolder = folderPath;
  await updateLastOpenedRootFolder(folderPath);

  return currentRootFolder;
}

export async function getAppState(): Promise<AppState> {
  return {
    currentRootFolder: await getCurrentRootFolder()
  };
}
