import { contextBridge, ipcRenderer } from 'electron';
import type { RequesterApi } from '../src/shared/api/requester';

const requesterApi: RequesterApi = {
  getAppState: () => ipcRenderer.invoke('app-state:getAppState'),
  getCurrentRootFolder: () =>
    ipcRenderer.invoke('app-state:getCurrentRootFolder'),
  openRootFolderDialog: () =>
    ipcRenderer.invoke('app-state:openRootFolderDialog'),
  ensureDefaultRootFolder: () =>
    ipcRenderer.invoke('app-state:ensureDefaultRootFolder'),
  readTree: () => ipcRenderer.invoke('tree:readTree'),
  createFolder: (parentPath, name) =>
    ipcRenderer.invoke('tree:createFolder', parentPath, name),
  createRequest: (parentPath, name) =>
    ipcRenderer.invoke('tree:createRequest', parentPath, name),
  renameEntry: (entryPath, newName) =>
    ipcRenderer.invoke('tree:renameEntry', entryPath, newName),
  deleteEntry: (entryPath) => ipcRenderer.invoke('tree:deleteEntry', entryPath),
  readRequest: (filePath) =>
    ipcRenderer.invoke('requests:readRequest', filePath),
  saveRequest: (filePath, data) =>
    ipcRenderer.invoke('requests:saveRequest', filePath, data)
};

contextBridge.exposeInMainWorld('requesterApi', requesterApi);
