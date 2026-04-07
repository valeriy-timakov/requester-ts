import { ipcMain } from 'electron';
import { readTree } from '../services/fileTreeService';
import {
  createFolder,
  createRequest,
  deleteEntry,
  renameEntry
} from '../services/fileMutationService';
import { getCurrentRootFolder } from '../services/projectService';

export function registerTreeHandlers(): void {
  ipcMain.handle('tree:readTree', async () => {
    const rootFolder = await getCurrentRootFolder();
    return readTree(rootFolder);
  });

  ipcMain.handle(
    'tree:createFolder',
    async (_event, parentPath: string, name: string) => {
      await createFolder(parentPath, name);
    }
  );

  ipcMain.handle(
    'tree:createRequest',
    async (_event, parentPath: string, name: string) => {
      return createRequest(parentPath, name);
    }
  );

  ipcMain.handle(
    'tree:renameEntry',
    async (_event, entryPath: string, newName: string) => {
      return renameEntry(entryPath, newName);
    }
  );

  ipcMain.handle('tree:deleteEntry', async (_event, entryPath: string) => {
    await deleteEntry(entryPath);
  });
}
