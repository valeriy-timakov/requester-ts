import type {
  AppState,
  RequestDocument,
  RequestFile,
  TreeEntry
} from '../types/requester';

export interface RequesterApi {
  getAppState: () => Promise<AppState>;
  getCurrentRootFolder: () => Promise<string>;
  openRootFolderDialog: () => Promise<AppState>;
  ensureDefaultRootFolder: () => Promise<string>;
  readTree: () => Promise<TreeEntry[]>;
  createFolder: (parentPath: string, name: string) => Promise<void>;
  createRequest: (parentPath: string, name: string) => Promise<string>;
  renameEntry: (entryPath: string, newName: string) => Promise<string>;
  deleteEntry: (entryPath: string) => Promise<void>;
  readRequest: (filePath: string) => Promise<RequestDocument>;
  saveRequest: (filePath: string, data: RequestFile) => Promise<void>;
}
