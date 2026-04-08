import { contextBridge, ipcRenderer } from 'electron';
import type { MenuAction, RequesterApi } from '../src/shared/api/requester';

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
    ipcRenderer.invoke('requests:saveRequest', filePath, data),
  addAttachment: (requestPath) =>
    ipcRenderer.invoke('request:addAttachment', requestPath),
  removeAttachment: (requestPath, attachmentRelativePath) =>
    ipcRenderer.invoke(
      'request:removeAttachment',
      requestPath,
      attachmentRelativePath
    ),
  executeRequest: (path) => ipcRenderer.invoke('request:execute', path),
  setHasDirtyTabs: (hasDirtyTabs) =>
    ipcRenderer.invoke('app-state:setHasDirtyTabs', hasDirtyTabs),
  onMenuAction: (listener) => {
    const handler = (_event: Electron.IpcRendererEvent, action: MenuAction) => {
      listener(action);
    };
    ipcRenderer.on('menu:action', handler);
    return () => {
      ipcRenderer.removeListener('menu:action', handler);
    };
  }
};

contextBridge.exposeInMainWorld('requesterApi', requesterApi);
