import type { AppState, TreeEntry } from '../types/requester';

export interface RequesterApi {
  getAppState: () => Promise<AppState>;
  getCurrentRootFolder: () => Promise<string>;
  openRootFolderDialog: () => Promise<AppState>;
  ensureDefaultRootFolder: () => Promise<string>;
  readTree: () => Promise<TreeEntry[]>;
}
