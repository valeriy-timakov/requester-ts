import { contextBridge, ipcRenderer } from 'electron';
import type { RequesterApi } from '../src/shared/api/requester';

const requesterApi: RequesterApi = {
  getAppState: () => ipcRenderer.invoke('app-state:getAppState'),
  getCurrentRootFolder: () => ipcRenderer.invoke('app-state:getCurrentRootFolder'),
  openRootFolderDialog: () => ipcRenderer.invoke('app-state:openRootFolderDialog'),
  ensureDefaultRootFolder: () =>
    ipcRenderer.invoke('app-state:ensureDefaultRootFolder'),
  readTree: () => ipcRenderer.invoke('tree:readTree')
};

contextBridge.exposeInMainWorld('requesterApi', requesterApi);
