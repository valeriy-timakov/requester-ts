import type {
  AppState,
  RequestDocument,
  RequestExecutionResponse,
  RequestFile,
  RequestReadResult,
  TreeEntry
} from '../types/requester';

export type MenuAction =
  | 'open-folder'
  | 'save-active-tab'
  | 'send-active-tab'
  | 'close-active-tab';

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
  readRequest: (filePath: string) => Promise<RequestReadResult>;
  saveRequest: (filePath: string, data: RequestFile) => Promise<void>;
  addAttachment: (requestPath: string) => Promise<RequestDocument | null>;
  removeAttachment: (
    requestPath: string,
    attachmentRelativePath: string
  ) => Promise<RequestDocument>;
  executeRequest: (path: string) => Promise<RequestExecutionResponse>;
  setHasDirtyTabs: (hasDirtyTabs: boolean) => Promise<void>;
  onMenuAction: (listener: (action: MenuAction) => void) => () => void;
}
