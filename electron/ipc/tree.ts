import { ipcMain } from 'electron';
import { readTree } from '../services/fileTreeService';
import {
  createFolder,
  createRequest,
  deleteEntry,
  renameEntry
} from '../services/fileMutationService';
import {
  isPathInsideRoot,
  resolvePathFromRoot
} from '../services/pathSafety';
import { getCurrentRootFolder } from '../services/projectService';

export function registerTreeHandlers(): void {
  const readTreeFromCurrentRoot = async () => {
    const rootFolder = await getCurrentRootFolder();
    return readTree(rootFolder);
  };

  ipcMain.handle('tree:readTree', readTreeFromCurrentRoot);
  ipcMain.handle('tree:refresh', readTreeFromCurrentRoot);

  ipcMain.handle(
    'tree:createFolder',
    async (_event, parentPath: string, name: string) => {
      const rootFolder = await getCurrentRootFolder();
      const absoluteParentPath = resolvePathFromRoot(rootFolder, parentPath);

      if (!isPathInsideRoot(rootFolder, absoluteParentPath)) {
        throw new Error('Folder path must be inside the current root folder.');
      }

      await createFolder(absoluteParentPath, name);
    }
  );

  ipcMain.handle(
    'tree:createRequest',
    async (_event, parentPath: string, name: string) => {
      const rootFolder = await getCurrentRootFolder();
      const absoluteParentPath = resolvePathFromRoot(rootFolder, parentPath);

      if (!isPathInsideRoot(rootFolder, absoluteParentPath)) {
        throw new Error('Folder path must be inside the current root folder.');
      }

      return createRequest(absoluteParentPath, name);
    }
  );

  ipcMain.handle(
    'tree:renameEntry',
    async (_event, entryPath: string, newName: string) => {
      const rootFolder = await getCurrentRootFolder();
      const absoluteEntryPath = resolvePathFromRoot(rootFolder, entryPath);

      if (!isPathInsideRoot(rootFolder, absoluteEntryPath)) {
        throw new Error('Entry path must be inside the current root folder.');
      }

      return renameEntry(absoluteEntryPath, newName);
    }
  );

  ipcMain.handle('tree:deleteEntry', async (_event, entryPath: string) => {
    const rootFolder = await getCurrentRootFolder();
    const absoluteEntryPath = resolvePathFromRoot(rootFolder, entryPath);

    if (!isPathInsideRoot(rootFolder, absoluteEntryPath)) {
      throw new Error('Entry path must be inside the current root folder.');
    }

    await deleteEntry(absoluteEntryPath);
  });
}
