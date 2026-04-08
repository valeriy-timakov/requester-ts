import { ipcMain } from 'electron';
import {
  ensureDefaultRootFolder,
  getAppState,
  getCurrentRootFolder,
  openRootFolderDialog
} from '../services/projectService';
import { setWindowHasDirtyTabs } from '../services/windowStateService';

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
    return openRootFolderDialog();
  });

  ipcMain.handle(
    'app-state:setHasDirtyTabs',
    async (event, hasDirtyTabs: boolean) => {
      setWindowHasDirtyTabs(event.sender.id, Boolean(hasDirtyTabs));
    }
  );
}
