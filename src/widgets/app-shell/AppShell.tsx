import { useEffect, useMemo, useState } from 'react';
import { cloneRequestFile } from '@/entities/request/model/requestFile';
import {
  createTabState,
  markTabSaved,
  updateTabDraft,
  type RequestTabState
} from '@/features/request-tabs/model/tabState';
import type { AppState, OpenTab, TreeEntry } from '@/shared/types/requester';
import {
  DialogModal,
  type DialogModalState
} from '@/widgets/dialog-modal/DialogModal';
import { RequestEditor } from '@/widgets/request-editor/RequestEditor';
import { RequestTabs } from '@/widgets/request-tabs/RequestTabs';
import { TreeView } from '@/widgets/tree-view/TreeView';
import './app-shell.css';

const initialAppState: AppState = {
  currentRootFolder: ''
};

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
      setError(
        loadError instanceof Error
          ? loadError.message
          : 'Failed to load application state.'
      );
      setTreeEntries([]);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadInitialState();
  }, []);

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

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 's') {
        event.preventDefault();
        void handleSaveActiveTab();
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [activeTabPath, openTabs]);

  function getRelatedTabs(entryPath: string): RequestTabState[] {
    return openTabs.filter((tab) =>
      isMatchingOrNestedPath(tab.path, entryPath)
    );
  }

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

  async function handleCreateFolder(parentPath: string) {
    const name = await requestPrompt('Create Folder', 'New Folder', 'Create');
    if (!name) {
      return;
    }

    try {
      await window.requesterApi.createFolder(parentPath, name);
      await loadTree();
    } catch (mutationError) {
      setError(
        mutationError instanceof Error
          ? mutationError.message
          : 'Failed to create folder.'
      );
    }
  }

  async function handleCreateRequest(parentPath: string) {
    const name = await requestPrompt('Create Request', 'New Request', 'Create');
    if (!name) {
      return;
    }

    try {
      const requestPath = await window.requesterApi.createRequest(
        parentPath,
        name
      );
      await loadTree();
      await handleOpenRequest(requestPath);
    } catch (mutationError) {
      setError(
        mutationError instanceof Error
          ? mutationError.message
          : 'Failed to create request.'
      );
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
      const nextPath = await window.requesterApi.renameEntry(
        entry.path,
        nextName
      );
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

          if (
            entry.type === 'folder' &&
            isMatchingOrNestedPath(tab.path, entry.path)
          ) {
            return { ...tab, path: tab.path.replace(entry.path, nextPath) };
          }

          return tab;
        })
      );
      setActiveTabPath((currentPath) => {
        if (!currentPath) {
          return currentPath;
        }

        if (currentPath === entry.path && entry.type === 'request') {
          return nextPath;
        }

        if (
          entry.type === 'folder' &&
          isMatchingOrNestedPath(currentPath, entry.path)
        ) {
          return currentPath.replace(entry.path, nextPath);
        }

        return currentPath;
      });
      await loadTree();
    } catch (mutationError) {
      setError(
        mutationError instanceof Error
          ? mutationError.message
          : 'Failed to rename entry.'
      );
    }
  }

  async function handleDeleteEntry(entry: TreeEntry) {
    const affectedTabs = getRelatedTabs(entry.path);
    const hasDirtyTabs = affectedTabs.some((tab) => tab.isDirty);
    const confirmMessage = hasDirtyTabs
      ? `Delete ${entry.name}? Unsaved changes in open tabs will be lost.`
      : `Delete ${entry.name}? This cannot be undone.`;

    if (!(await requestConfirmation(confirmMessage, 'Delete'))) {
      return;
    }

    try {
      await window.requesterApi.deleteEntry(entry.path);
      const nextTabs = openTabs.filter(
        (tab) => !isMatchingOrNestedPath(tab.path, entry.path)
      );
      setOpenTabs(nextTabs);
      setActiveTabPath((currentPath) =>
        currentPath && isMatchingOrNestedPath(currentPath, entry.path)
          ? (nextTabs[nextTabs.length - 1]?.path ?? null)
          : currentPath
      );
      await loadTree();
    } catch (mutationError) {
      setError(
        mutationError instanceof Error
          ? mutationError.message
          : 'Failed to delete entry.'
      );
    }
  }

  async function handleOpenRequest(requestPath: string) {
    const existingTab = openTabs.find((tab) => tab.path === requestPath);
    if (existingTab) {
      setActiveTabPath(existingTab.path);
      return;
    }

    try {
      const requestDocument =
        await window.requesterApi.readRequest(requestPath);
      const nextTab = createTabState(requestDocument);

      setOpenTabs((currentTabs) => [...currentTabs, nextTab]);
      setActiveTabPath(requestPath);
      setError(null);
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : 'Failed to open request.'
      );
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

  async function handleSaveTab(pathToSave = activeTabPath) {
    if (!pathToSave) {
      return;
    }

    const tab = openTabs.find((item) => item.path === pathToSave);
    if (!tab) {
      return;
    }

    try {
      let nextPath = tab.path;
      const nextRequest = cloneRequestFile(tab.draft);

      if (nextRequest.name.trim() !== tab.lastSaved.name.trim()) {
        nextPath = await window.requesterApi.renameEntry(
          tab.path,
          nextRequest.name
        );
      }

      await window.requesterApi.saveRequest(nextPath, nextRequest);
      setOpenTabs((currentTabs) =>
        currentTabs.map((currentTab) =>
          currentTab.path === tab.path
            ? markTabSaved(currentTab, nextPath, nextRequest)
            : currentTab
        )
      );
      setActiveTabPath(nextPath);
      await loadTree();
      setError(null);
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : 'Failed to save request.'
      );
    }
  }

  async function handleSaveActiveTab() {
    await handleSaveTab(activeTabPath);
  }

  async function handleCloseTab(pathToClose: string) {
    const tab = openTabs.find((item) => item.path === pathToClose);
    if (!tab) {
      return;
    }

    if (
      tab.isDirty &&
      !(await requestConfirmation(
        `Close ${tab.title} without saving?`,
        'Close Tab'
      ))
    ) {
      return;
    }

    const nextTabs = openTabs.filter((item) => item.path !== pathToClose);
    setOpenTabs(nextTabs);

    if (activeTabPath === pathToClose) {
      const closedIndex = openTabs.findIndex(
        (item) => item.path === pathToClose
      );
      const fallbackTab =
        nextTabs[Math.max(0, closedIndex - 1)] ?? nextTabs[0] ?? null;
      setActiveTabPath(fallbackTab?.path ?? null);
    }
  }

  return (
    <>
      <div className="app-shell">
        <aside className="sidebar">
          <div className="sidebar__header">
            <div>
              <div className="eyebrow">Root Folder</div>
              <div
                className="root-folder-path"
                title={appState.currentRootFolder}
              >
                {appState.currentRootFolder || 'Loading...'}
              </div>
            </div>
            {error ? <div className="inline-error">{error}</div> : null}
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
              onClose={handleCloseTab}
            />
          </section>

          <section className="workspace__content">
            <RequestEditor
              request={activeTab?.draft ?? null}
              canSave={Boolean(activeTab?.isDirty)}
              onSave={() => {
                void handleSaveActiveTab();
              }}
              onChange={handleUpdateActiveRequest}
            />
          </section>
        </main>
      </div>
      <DialogModal dialog={dialogState} />
    </>
  );
}
