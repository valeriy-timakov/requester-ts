import { useEffect, useState } from 'react';
import type { AppState, TreeEntry } from '@/shared/types/requester';
import { TreeView } from '@/widgets/tree-view/TreeView';
import './app-shell.css';

const initialAppState: AppState = {
  currentRootFolder: ''
};

export function AppShell() {
  const [appState, setAppState] = useState<AppState>(initialAppState);
  const [treeEntries, setTreeEntries] = useState<TreeEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
        loadError instanceof Error ? loadError.message : 'Failed to load application state.'
      );
      setTreeEntries([]);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadInitialState();
  }, []);

  return (
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
          ) : error ? (
            <div className="tree-empty tree-empty--error">{error}</div>
          ) : (
            <TreeView entries={treeEntries} />
          )}
        </div>
      </aside>

      <main className="workspace">
        <section className="workspace__tabs">
          <div className="workspace__label">Tabs</div>
          <div className="workspace__placeholder">Request tabs will appear here in the next phase.</div>
        </section>

        <section className="workspace__content">
          <div className="workspace__label">Main Area</div>
          <div className="workspace__placeholder">
            Request editor and response viewer are out of scope for Phase 1.
          </div>
        </section>
      </main>
    </div>
  );
}
