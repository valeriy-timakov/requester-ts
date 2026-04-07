import type { OpenTab } from '@/shared/types/requester';

interface RequestTabsProps {
  tabs: OpenTab[];
  activePath: string | null;
  onSelect: (path: string) => void;
  onClose: (path: string) => void;
}

export function RequestTabs({
  tabs,
  activePath,
  onSelect,
  onClose
}: RequestTabsProps) {
  if (tabs.length === 0) {
    return (
      <div className="tabs-empty">
        Open a request from the tree to start editing.
      </div>
    );
  }

  return (
    <div className="tabs-list" role="tablist" aria-label="Open requests">
      {tabs.map((tab) => (
        <div
          key={tab.path}
          className={`tab-chip${tab.path === activePath ? ' tab-chip--active' : ''}`}
          role="tab"
          aria-selected={tab.path === activePath}
        >
          <button
            className="tab-chip__button"
            onClick={() => onSelect(tab.path)}
            type="button"
          >
            {tab.title}
            {tab.isDirty ? ' *' : ''}
          </button>
          <button
            className="tab-chip__close"
            onClick={() => onClose(tab.path)}
            type="button"
            aria-label={`Close ${tab.title}`}
          >
            x
          </button>
        </div>
      ))}
    </div>
  );
}
