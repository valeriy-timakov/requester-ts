import { useEffect, useMemo, useState } from 'react';
import { cloneRequestFile } from '@/entities/request/model/requestFile';
import {
  createTabState,
  markTabSaved,
  updateTabDraft,
  type RequestTabState
} from '@/features/request-tabs/model/tabState';
import type {
  AppState,
  OpenTab,
  RequestAttachment,
  RequestDocument,
  TreeEntry
} from '@/shared/types/requester';
import {
  DialogModal,
  type DialogModalState
} from '@/widgets/dialog-modal/DialogModal';
import { RequestEditor } from '@/widgets/request-editor/RequestEditor';
import { ResponseViewer } from '@/widgets/response-viewer/ResponseViewer';
import { RequestTabs } from '@/widgets/request-tabs/RequestTabs';
import { TreeView } from '@/widgets/tree-view/TreeView';
import './app-shell.css';

const initialAppState: AppState = {
  currentRootFolder: ''
};

type DirtyCloseChoice = 'save' | 'discard' | 'cancel';

function toUiErrorMessage(error: unknown, fallback: string): string {
  if (!(error instanceof Error) || !error.message) {
    return fallback;
  }

  const singleLineMessage = error.message.split('\n')[0]?.trim();
  if (!singleLineMessage) {
    return fallback;
  }

  return singleLineMessage.length > 220
    ? `${singleLineMessage.slice(0, 217)}...`
    : singleLineMessage;
}

export function AppShell() {
  const [appState, setAppState] = useState<AppState>(initialAppState);
  const [treeEntries, setTreeEntries] = useState<TreeEntry[]>([]);
  const [openTabs, setOpenTabs] = useState<RequestTabState[]>([]);
  const [activeTabPath, setActiveTabPath] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogState, setDialogState] = useState<DialogModalState | null>(null);

  const visibleTabs = useMemo<OpenTab[]>(
    () =>
      openTabs.map((tab) => ({
        path: tab.path,
        title: tab.title,
        isDirty: tab.isDirty,
        requestSnapshot: cloneRequestFile(tab.lastSaved)
      })),
    [openTabs]
  );

  const activeTab = openTabs.find((tab) => tab.path === activeTabPath) ?? null;
  const hasDirtyTabs = openTabs.some((tab) => tab.isDirty);

  function setActionError(fallback: string, errorValue: unknown): void {
    console.error(errorValue);
    setError(toUiErrorMessage(errorValue, fallback));
  }

  function isMatchingOrNestedPath(
    candidatePath: string,
    targetPath: string
  ): boolean {
    return (
      candidatePath === targetPath ||
      candidatePath.startsWith(`${targetPath}\\`) ||
      candidatePath.startsWith(`${targetPath}/`)
    );
  }

  function getRootRelativePath(absolutePath: string): string {
    const normalizedRoot = appState.currentRootFolder.replace(/\\/g, '/');
    const normalizedPath = absolutePath.replace(/\\/g, '/');
    const prefix = normalizedRoot.endsWith('/')
      ? normalizedRoot
      : `${normalizedRoot}/`;

    if (normalizedPath.startsWith(prefix)) {
      return normalizedPath.slice(prefix.length);
    }

    throw new Error('Request path must be inside the current root folder.');
  }

  async function loadTree() {
    const entries = await window.requesterApi.readTree();
    setTreeEntries(entries);
  }

  async function loadInitialState() {
    setIsLoading(true);
    setError(null);

    try {
      const state = await window.requesterApi.getAppState();
      setAppState(state);
      await loadTree();
    } catch (loadError) {
      setActionError('Failed to load application state.', loadError);
      setTreeEntries([]);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadInitialState();
    // Initial load should only run once on mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    void window.requesterApi.setHasDirtyTabs(hasDirtyTabs).catch((syncError) => {
      console.error(syncError);
    });
  }, [hasDirtyTabs]);

  function requestPrompt(
    title: string,
    initialValue: string,
    confirmLabel: string
  ): Promise<string | null> {
    return new Promise((resolve) => {
      let currentValue = initialValue;

      setDialogState({
        kind: 'prompt',
        title,
        confirmLabel,
        value: initialValue,
        onChange: (value) => {
          currentValue = value;
          setDialogState((currentDialog) =>
            currentDialog?.kind === 'prompt'
              ? {
                  ...currentDialog,
                  value
                }
              : currentDialog
          );
        },
        onCancel: () => {
          setDialogState(null);
          resolve(null);
        },
        onConfirm: () => {
          setDialogState(null);
          resolve(currentValue.trim());
        }
      });
    });
  }

  function requestConfirmation(
    message: string,
    confirmLabel: string
  ): Promise<boolean> {
    return new Promise((resolve) => {
      setDialogState({
        kind: 'confirm',
        title: 'Confirm Action',
        message,
        confirmLabel,
        onCancel: () => {
          setDialogState(null);
          resolve(false);
        },
        onConfirm: () => {
          setDialogState(null);
          resolve(true);
        }
      });
    });
  }

  function requestDirtyTabCloseConfirmation(title: string): Promise<DirtyCloseChoice> {
    return new Promise((resolve) => {
      setDialogState({
        kind: 'dirty-close',
        title: 'Unsaved Changes',
        message: `Save changes to ${title} before closing?`,
        onCancel: () => {
          setDialogState(null);
          resolve('cancel');
        },
        onDiscard: () => {
          setDialogState(null);
          resolve('discard');
        },
        onSave: () => {
          setDialogState(null);
          resolve('save');
        }
      });
    });
  }

  function getRelatedTabs(entryPath: string): RequestTabState[] {
    return openTabs.filter((tab) => isMatchingOrNestedPath(tab.path, entryPath));
  }

  function getActiveFallbackPath(
    tabsBefore: RequestTabState[],
    tabsAfter: RequestTabState[]
  ): string | null {
    if (!activeTabPath) {
      return null;
    }

    const activeIndex = tabsBefore.findIndex((tab) => tab.path === activeTabPath);
    if (activeIndex === -1) {
      return tabsAfter[0]?.path ?? null;
    }

    for (let index = activeIndex - 1; index >= 0; index -= 1) {
      const candidatePath = tabsBefore[index]?.path;
      if (candidatePath && tabsAfter.some((tab) => tab.path === candidatePath)) {
        return candidatePath;
      }
    }

    for (let index = activeIndex + 1; index < tabsBefore.length; index += 1) {
      const candidatePath = tabsBefore[index]?.path;
      if (candidatePath && tabsAfter.some((tab) => tab.path === candidatePath)) {
        return candidatePath;
      }
    }

    return tabsAfter[0]?.path ?? null;
  }

  function closeTabByPath(pathToClose: string): void {
    setOpenTabs((currentTabs) => {
      const closedIndex = currentTabs.findIndex((tab) => tab.path === pathToClose);
      if (closedIndex === -1) {
        return currentTabs;
      }

      const nextTabs = currentTabs.filter((tab) => tab.path !== pathToClose);
      setActiveTabPath((currentActivePath) => {
        if (currentActivePath !== pathToClose) {
          return currentActivePath;
        }

        const fallbackTab =
          nextTabs[Math.max(0, closedIndex - 1)] ?? nextTabs[0] ?? null;
        return fallbackTab?.path ?? null;
      });

      return nextTabs;
    });
  }

  function replaceActiveTabWithSavedDocument(document: RequestDocument) {
    setOpenTabs((currentTabs) =>
      currentTabs.map((tab) =>
        tab.path === document.path
          ? markTabSaved(tab, document.path, document.data)
          : tab
      )
    );
    setActiveTabPath(document.path);
  }

  async function handleOpenRootFolder() {
    try {
      const currentRoot = appState.currentRootFolder;
      const nextAppState = await window.requesterApi.openRootFolderDialog();

      setAppState(nextAppState);
      if (nextAppState.currentRootFolder !== currentRoot) {
        setOpenTabs([]);
        setActiveTabPath(null);
      }

      await loadTree();
      setError(null);
    } catch (folderError) {
      setActionError('Failed to open folder.', folderError);
    }
  }

  async function handleCreateFolder(parentPath: string) {
    const name = await requestPrompt('Create Folder', 'New Folder', 'Create');
    if (!name) {
      return;
    }

    try {
      await window.requesterApi.createFolder(parentPath, name);
      await loadTree();
      setError(null);
    } catch (mutationError) {
      setActionError('Failed to create folder.', mutationError);
    }
  }

  async function handleCreateRequest(parentPath: string) {
    const name = await requestPrompt('Create Request', 'New Request', 'Create');
    if (!name) {
      return;
    }

    try {
      const requestPath = await window.requesterApi.createRequest(parentPath, name);
      await loadTree();
      await handleOpenRequest(requestPath);
    } catch (mutationError) {
      setActionError('Failed to create request.', mutationError);
    }
  }

  async function handleRenameEntry(entry: TreeEntry) {
    const nextName = await requestPrompt(
      `Rename ${entry.type}`,
      entry.name,
      'Rename'
    );
    if (!nextName || nextName === entry.name) {
      return;
    }

    try {
      const nextPath = await window.requesterApi.renameEntry(entry.path, nextName);

      setOpenTabs((currentTabs) =>
        currentTabs.map((tab) => {
          if (tab.path === entry.path && entry.type === 'request') {
            return {
              ...tab,
              path: nextPath,
              title: nextName,
              draft: { ...tab.draft, name: nextName },
              lastSaved: { ...tab.lastSaved, name: nextName }
            };
          }

          if (entry.type === 'folder' && isMatchingOrNestedPath(tab.path, entry.path)) {
            return {
              ...tab,
              path: tab.path.replace(entry.path, nextPath)
            };
          }

          return tab;
        })
      );

      setActiveTabPath((currentPath) => {
        if (!currentPath) {
          return currentPath;
        }

        if (entry.type === 'request' && currentPath === entry.path) {
          return nextPath;
        }

        if (entry.type === 'folder' && isMatchingOrNestedPath(currentPath, entry.path)) {
          return currentPath.replace(entry.path, nextPath);
        }

        return currentPath;
      });

      await loadTree();
      setError(null);
    } catch (renameError) {
      setActionError('Failed to rename item.', renameError);
    }
  }

  async function handleDeleteEntry(entry: TreeEntry) {
    const affectedTabs = getRelatedTabs(entry.path);
    const hasAffectedDirtyTabs = affectedTabs.some((tab) => tab.isDirty);

    if (hasAffectedDirtyTabs) {
      const confirmed = await requestConfirmation(
        'Some affected requests have unsaved changes. Delete anyway?',
        'Delete'
      );
      if (!confirmed) {
        return;
      }
    }

    try {
      await window.requesterApi.deleteEntry(entry.path);

      const nextTabs = openTabs.filter(
        (tab) => !isMatchingOrNestedPath(tab.path, entry.path)
      );
      const isActiveTabDeleted =
        activeTabPath !== null && isMatchingOrNestedPath(activeTabPath, entry.path);

      setOpenTabs(nextTabs);
      if (isActiveTabDeleted) {
        setActiveTabPath(getActiveFallbackPath(openTabs, nextTabs));
      }

      await loadTree();
      setError(null);
    } catch (deleteError) {
      setActionError('Failed to delete item.', deleteError);
    }
  }

  async function handleOpenRequest(requestPath: string) {
    const existingTab = openTabs.find((tab) => tab.path === requestPath);
    if (existingTab) {
      setActiveTabPath(existingTab.path);
      return;
    }

    try {
      const result = await window.requesterApi.readRequest(requestPath);
      if (!result.ok) {
        setError(result.error.message);
        return;
      }

      const nextTab = createTabState(result.document);

      setOpenTabs((currentTabs) => [...currentTabs, nextTab]);
      setActiveTabPath(requestPath);
      setError(null);
    } catch (loadError) {
      setActionError('Failed to open request.', loadError);
    }
  }

  function handleUpdateActiveRequest(
    updater: (request: RequestTabState['draft']) => RequestTabState['draft']
  ) {
    if (!activeTabPath) {
      return;
    }

    setOpenTabs((currentTabs) =>
      currentTabs.map((tab) =>
        tab.path === activeTabPath ? updateTabDraft(tab, updater) : tab
      )
    );
  }

  async function handleAddAttachment() {
    if (!activeTabPath) {
      return;
    }

    try {
      const updatedDocument = await window.requesterApi.addAttachment(
        getRootRelativePath(activeTabPath)
      );
      if (!updatedDocument) {
        return;
      }

      replaceActiveTabWithSavedDocument(updatedDocument);
      setError(null);
    } catch (attachmentError) {
      setActionError('Failed to add attachment.', attachmentError);
    }
  }

  async function handleRemoveAttachment(attachment: RequestAttachment) {
    if (!activeTabPath) {
      return;
    }

    try {
      const updatedDocument = await window.requesterApi.removeAttachment(
        getRootRelativePath(activeTabPath),
        attachment.relativePath
      );
      replaceActiveTabWithSavedDocument(updatedDocument);
      setError(null);
    } catch (attachmentError) {
      setActionError('Failed to remove attachment.', attachmentError);
    }
  }

  async function handleSaveTab(pathToSave: string | null): Promise<string | null> {
    if (!pathToSave) {
      return null;
    }

    const tab = openTabs.find((item) => item.path === pathToSave);
    if (!tab) {
      return null;
    }

    try {
      let nextPath = tab.path;
      const nextRequest = cloneRequestFile(tab.draft);

      if (nextRequest.name.trim() !== tab.lastSaved.name.trim()) {
        nextPath = await window.requesterApi.renameEntry(tab.path, nextRequest.name);
      }

      await window.requesterApi.saveRequest(nextPath, nextRequest);

      setOpenTabs((currentTabs) =>
        currentTabs.map((currentTab) =>
          currentTab.path === tab.path
            ? markTabSaved(currentTab, nextPath, nextRequest)
            : currentTab
        )
      );
      setActiveTabPath((currentPath) =>
        currentPath === tab.path ? nextPath : currentPath
      );

      await loadTree();
      setError(null);
      return nextPath;
    } catch (saveError) {
      setActionError('Failed to save request.', saveError);
      return null;
    }
  }

  async function handleSaveActiveTab(): Promise<void> {
    await handleSaveTab(activeTabPath);
  }

  async function handleSendActiveTab(): Promise<void> {
    if (!activeTabPath) {
      return;
    }

    const tab = openTabs.find((item) => item.path === activeTabPath);
    if (!tab || tab.isSending) {
      return;
    }

    const savedPath = tab.isDirty ? await handleSaveTab(activeTabPath) : tab.path;
    if (!savedPath) {
      return;
    }

    setOpenTabs((currentTabs) =>
      currentTabs.map((currentTab) =>
        currentTab.path === savedPath
          ? { ...currentTab, isSending: true, responseError: null }
          : currentTab
      )
    );

    try {
      const response = await window.requesterApi.executeRequest(
        getRootRelativePath(savedPath)
      );

      setOpenTabs((currentTabs) =>
        currentTabs.map((currentTab) =>
          currentTab.path === savedPath
            ? {
                ...currentTab,
                isSending: false,
                responseError: null,
                lastResponse: response
              }
            : currentTab
        )
      );
      setError(null);
    } catch (sendError) {
      const responseError = toUiErrorMessage(
        sendError,
        'Failed to execute request.'
      );

      setOpenTabs((currentTabs) =>
        currentTabs.map((currentTab) =>
          currentTab.path === savedPath
            ? {
                ...currentTab,
                isSending: false,
                responseError
              }
            : currentTab
        )
      );
      console.error(sendError);
    }
  }

  async function handleCloseTab(pathToClose: string): Promise<boolean> {
    const tab = openTabs.find((item) => item.path === pathToClose);
    if (!tab) {
      return false;
    }

    let resolvedPathToClose = pathToClose;

    if (tab.isDirty) {
      const decision = await requestDirtyTabCloseConfirmation(tab.title);

      if (decision === 'cancel') {
        return false;
      }

      if (decision === 'save') {
        const savedPath = await handleSaveTab(pathToClose);
        if (!savedPath) {
          return false;
        }

        resolvedPathToClose = savedPath;
      }
    }

    closeTabByPath(resolvedPathToClose);
    return true;
  }

  async function handleCloseActiveTab(): Promise<void> {
    if (!activeTabPath) {
      return;
    }

    await handleCloseTab(activeTabPath);
  }

  useEffect(() => {
    const unsubscribe = window.requesterApi.onMenuAction((action) => {
      switch (action) {
        case 'open-folder': {
          void handleOpenRootFolder();
          break;
        }
        case 'save-active-tab': {
          void handleSaveActiveTab();
          break;
        }
        case 'send-active-tab': {
          void handleSendActiveTab();
          break;
        }
        case 'close-active-tab': {
          void handleCloseActiveTab();
          break;
        }
      }
    });

    return () => {
      unsubscribe();
    };
    // Menu actions should stay wired once and use latest render closures.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTabPath, appState.currentRootFolder, openTabs]);

  return (
    <>
      <div className="app-shell">
        <aside className="sidebar">
          <div className="sidebar__header">
            <div>
              <div className="eyebrow">Root Folder</div>
              <div className="root-folder-path" title={appState.currentRootFolder}>
                {appState.currentRootFolder || 'Loading...'}
              </div>
            </div>
          </div>

          <div className="sidebar__body">
            {isLoading ? (
              <div className="tree-empty">Loading tree...</div>
            ) : (
              <TreeView
                entries={treeEntries}
                rootPath={appState.currentRootFolder}
                onOpenRequest={handleOpenRequest}
                onCreateFolder={handleCreateFolder}
                onCreateRequest={handleCreateRequest}
                onRenameEntry={handleRenameEntry}
                onDeleteEntry={handleDeleteEntry}
              />
            )}
          </div>
        </aside>

        <main className="workspace">
          <section className="workspace__tabs">
            <div className="workspace__label">Tabs</div>
            <RequestTabs
              tabs={visibleTabs}
              activePath={activeTabPath}
              onSelect={setActiveTabPath}
              onClose={(path) => {
                void handleCloseTab(path);
              }}
            />
          </section>

          <section className="workspace__content">
            {error ? <div className="inline-error">{error}</div> : null}

            {activeTab ? (
              <>
                <RequestEditor
                  request={activeTab.draft}
                  canSave={activeTab.isDirty}
                  isSending={activeTab.isSending}
                  onSave={() => {
                    void handleSaveActiveTab();
                  }}
                  onSend={() => {
                    void handleSendActiveTab();
                  }}
                  onChange={handleUpdateActiveRequest}
                  onAddAttachment={() => {
                    void handleAddAttachment();
                  }}
                  onRemoveAttachment={(attachment) => {
                    void handleRemoveAttachment(attachment);
                  }}
                />
                <ResponseViewer
                  response={activeTab.lastResponse}
                  isLoading={activeTab.isSending}
                  error={activeTab.responseError}
                />
              </>
            ) : (
              <div className="workspace-empty">
                <div className="workspace__label">No Request Selected</div>
                <div className="workspace__placeholder">
                  Open a request from the tree to edit, save, and send it.
                </div>
              </div>
            )}
          </section>
        </main>
      </div>
      <DialogModal dialog={dialogState} />
    </>
  );
}
