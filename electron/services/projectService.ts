import { app, dialog } from 'electron';
import { mkdir, readdir, stat } from 'fs/promises';
import path from 'path';
import type { AppState, RootFolderStatus } from '../../src/shared/types/requester';
import { readMetadata, updateLastOpenedRootFolder } from './appStateService';

let currentRootFolder: string | null = null;
let rootInitializationError: string | null = null;

async function resolveDirectoryAccessError(
  folderPath: string
): Promise<string | null> {
  try {
    const folderStats = await stat(folderPath);
    if (!folderStats.isDirectory()) {
      return `Root folder is not a directory: ${folderPath}`;
    }

    await readdir(folderPath);
    return null;
  } catch (error) {
    const code = (error as NodeJS.ErrnoException)?.code;
    if (code === 'ENOENT') {
      return `Root folder no longer exists: ${folderPath}`;
    }

    if (code === 'EACCES' || code === 'EPERM') {
      return `Cannot access root folder due to permissions: ${folderPath}`;
    }

    return `Cannot access root folder: ${folderPath}`;
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

export async function resolveInitialRootFolder(): Promise<string | null> {
  const metadata = await readMetadata();

  if (metadata.lastOpenedRootFolder) {
    const accessError = await resolveDirectoryAccessError(
      metadata.lastOpenedRootFolder
    );
    if (!accessError) {
      currentRootFolder = metadata.lastOpenedRootFolder;
      rootInitializationError = null;
      return currentRootFolder;
    }
  }

  try {
    currentRootFolder = await ensureDefaultRootFolder();
    const accessError = await resolveDirectoryAccessError(currentRootFolder);
    if (accessError) {
      currentRootFolder = null;
      rootInitializationError = accessError;
      return null;
    }

    rootInitializationError = null;
  } catch {
    currentRootFolder = null;
    rootInitializationError = `Failed to create default root folder at ${getDefaultRootFolderPath()}. Choose another folder to continue.`;
  }

  return currentRootFolder;
}

export async function getCurrentRootFolder(): Promise<string> {
  if (currentRootFolder) {
    const accessError = await resolveDirectoryAccessError(currentRootFolder);
    if (accessError) {
      throw new Error(accessError);
    }

    return currentRootFolder;
  }

  const resolvedRootFolder = await resolveInitialRootFolder();
  if (!resolvedRootFolder) {
    throw new Error(
      rootInitializationError ??
        'No root folder is available. Choose another folder to continue.'
    );
  }

  return resolvedRootFolder;
}

export async function setRootFolder(folderPath: string): Promise<string> {
  const accessError = await resolveDirectoryAccessError(folderPath);
  if (accessError) {
    throw new Error(accessError);
  }

  currentRootFolder = folderPath;
  rootInitializationError = null;
  await updateLastOpenedRootFolder(folderPath);

  return currentRootFolder;
}

export async function pickRootFolderDialog(): Promise<string | null> {
  const currentRootFolderPath =
    currentRootFolder ?? getDefaultRootFolderPath();
  const result = await dialog.showOpenDialog({
    title: 'Open Root Folder',
    defaultPath: currentRootFolderPath,
    properties: ['openDirectory']
  });

  if (result.canceled || result.filePaths.length === 0) {
    return null;
  }

  return result.filePaths[0] ?? null;
}

export async function switchRootFolder(folderPath: string): Promise<AppState> {
  await setRootFolder(folderPath);
  return getAppState();
}

export async function getCurrentRootStatus(): Promise<RootFolderStatus> {
  if (!currentRootFolder) {
    await resolveInitialRootFolder();
  }

  if (!currentRootFolder) {
    return {
      currentRootFolder: null,
      isAvailable: false,
      errorMessage:
        rootInitializationError ??
        'No root folder is available. Choose another folder to continue.'
    };
  }

  const accessError = await resolveDirectoryAccessError(currentRootFolder);
  if (accessError) {
    return {
      currentRootFolder,
      isAvailable: false,
      errorMessage: accessError
    };
  }

  return {
    currentRootFolder,
    isAvailable: true,
    errorMessage: null
  };
}

export async function getAppState(): Promise<AppState> {
  const rootStatus = await getCurrentRootStatus();

  return {
    currentRootFolder: rootStatus.currentRootFolder,
    rootAvailable: rootStatus.isAvailable,
    rootError: rootStatus.errorMessage
  };
}
