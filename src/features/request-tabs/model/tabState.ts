import {
  areRequestFilesEqual,
  cloneRequestFile
} from '@/entities/request/model/requestFile';
import type { RequestDocument, RequestFile } from '@/shared/types/requester';

export interface RequestTabState {
  path: string;
  title: string;
  draft: RequestFile;
  lastSaved: RequestFile;
  isDirty: boolean;
}

export function createTabState(document: RequestDocument): RequestTabState {
  return {
    path: document.path,
    title: document.data.name,
    draft: cloneRequestFile(document.data),
    lastSaved: cloneRequestFile(document.data),
    isDirty: false
  };
}

export function updateTabDraft(
  tab: RequestTabState,
  updater: (draft: RequestFile) => RequestFile
): RequestTabState {
  const nextDraft = updater(cloneRequestFile(tab.draft));

  return {
    ...tab,
    draft: nextDraft,
    title: nextDraft.name,
    isDirty: !areRequestFilesEqual(nextDraft, tab.lastSaved)
  };
}

export function markTabSaved(
  tab: RequestTabState,
  path: string,
  requestFile: RequestFile
): RequestTabState {
  const snapshot = cloneRequestFile(requestFile);

  return {
    path,
    title: snapshot.name,
    draft: snapshot,
    lastSaved: cloneRequestFile(snapshot),
    isDirty: false
  };
}
