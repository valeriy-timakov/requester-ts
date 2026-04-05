import { dialog, ipcMain } from 'electron';
import {
  ensureDefaultRootFolder,
  getAppState,
  getCurrentRootFolder,
  setRootFolder
} from '../services/projectService';

export function registerAppStateHandlers(): void {
  ipcMain.handle('app-state:getAppState', async () => {
    return getAppState();
  });

  ipcMain.handle('app-state:getCurrentRootFolder', async () => {
    return getCurrentRootFolder();
  });

  ipcMain.handle('app-state:ensureDefaultRootFolder', async () => {
    return ensureDefaultRootFolder();
  });

  ipcMain.handle('app-state:openRootFolderDialog', async () => {
    const currentRootFolder = await getCurrentRootFolder();
    const result = await dialog.showOpenDialog({
      title: 'Open Root Folder',
      defaultPath: currentRootFolder,
      properties: ['openDirectory']
    });

    if (result.canceled || result.filePaths.length === 0) {
      return getAppState();
    }

    await setRootFolder(result.filePaths[0]);
    return getAppState();
  });
}
