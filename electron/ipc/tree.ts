import { ipcMain } from 'electron';
import { readTree } from '../services/fileTreeService';
import { getCurrentRootFolder } from '../services/projectService';

export function registerTreeHandlers(): void {
  ipcMain.handle('tree:readTree', async () => {
    const rootFolder = await getCurrentRootFolder();
    return readTree(rootFolder);
  });
}
