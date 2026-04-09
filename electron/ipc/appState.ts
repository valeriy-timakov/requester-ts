import { ipcMain } from 'electron';
import {
  ensureDefaultRootFolder,
  getAppState,
  getCurrentRootStatus,
  getCurrentRootFolder,
  pickRootFolderDialog,
  switchRootFolder
} from '../services/projectService';
import { setWindowHasDirtyTabs } from '../services/windowStateService';

export function registerAppStateHandlers(): void {
  ipcMain.handle('app-state:getAppState', async () => {
    return getAppState();
  });

  ipcMain.handle('app-state:getCurrentRootFolder', async () => {
    return getCurrentRootFolder();
  });

  ipcMain.handle('app-state:getCurrentRootStatus', async () => {
    return getCurrentRootStatus();
  });

  ipcMain.handle('app-state:ensureDefaultRootFolder', async () => {
    return ensureDefaultRootFolder();
  });

  ipcMain.handle('app-state:pickRootFolderDialog', async () => {
    return pickRootFolderDialog();
  });

  ipcMain.handle('app-state:switchRootFolder', async (_event, folderPath: string) => {
    return switchRootFolder(folderPath);
  });

  ipcMain.handle(
    'app-state:setHasDirtyTabs',
    async (event, hasDirtyTabs: boolean) => {
      setWindowHasDirtyTabs(event.sender.id, Boolean(hasDirtyTabs));
    }
  );
}
