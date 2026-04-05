export interface AppMetadata {
  lastOpenedRootFolder?: string;
}

export interface AppState {
  currentRootFolder: string;
}

export type TreeEntryType = 'folder' | 'request';

export interface TreeEntry {
  path: string;
  name: string;
  type: TreeEntryType;
  children?: TreeEntry[];
}
