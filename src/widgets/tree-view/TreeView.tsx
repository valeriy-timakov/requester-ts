import type { TreeEntry } from '@/shared/types/requester';

interface TreeViewProps {
  entries: TreeEntry[];
  rootPath: string | null;
  canMutate: boolean;
  onOpenRequest: (path: string) => void;
  onCreateFolder: (parentPath: string) => void;
  onCreateRequest: (parentPath: string) => void;
  onRenameEntry: (entry: TreeEntry) => void;
  onDeleteEntry: (entry: TreeEntry) => void;
  onRefresh: () => void;
}

interface TreeNodeProps {
  entry: TreeEntry;
  depth: number;
  onOpenRequest: (path: string) => void;
  onCreateFolder: (parentPath: string) => void;
  onCreateRequest: (parentPath: string) => void;
  onRenameEntry: (entry: TreeEntry) => void;
  onDeleteEntry: (entry: TreeEntry) => void;
}

function TreeNode({
  entry,
  depth,
  onOpenRequest,
  onCreateFolder,
  onCreateRequest,
  onRenameEntry,
  onDeleteEntry
}: TreeNodeProps) {
  const paddingLeft = 12 + depth * 16;

  return (
    <li>
      <div
        className={`tree-node${entry.type === 'request' ? ' tree-node--clickable tree-node--request' : ' tree-node--folder'}`}
        style={{ paddingLeft }}
      >
        <button
          className="tree-node__main"
          onClick={() => {
            if (entry.type === 'request') {
              onOpenRequest(entry.path);
            }
          }}
          type="button"
        >
          <span className="tree-node__icon">
            {entry.type === 'folder' ? 'DIR' : 'REQ'}
          </span>
          <span>{entry.name}</span>
        </button>

        <div className="tree-node__actions">
          {entry.type === 'folder' ? (
            <>
              <button onClick={() => onCreateFolder(entry.path)} type="button">
                +Folder
              </button>
              <button onClick={() => onCreateRequest(entry.path)} type="button">
                +Request
              </button>
            </>
          ) : null}
          <button onClick={() => onRenameEntry(entry)} type="button">
            Rename
          </button>
          <button
            className="tree-node__delete"
            onClick={() => onDeleteEntry(entry)}
            type="button"
          >
            Delete
          </button>
        </div>
      </div>

      {entry.type === 'folder' &&
      entry.children &&
      entry.children.length > 0 ? (
        <ul className="tree-list">
          {entry.children.map((childEntry) => (
            <TreeNode
              key={childEntry.path}
              entry={childEntry}
              depth={depth + 1}
              onOpenRequest={onOpenRequest}
              onCreateFolder={onCreateFolder}
              onCreateRequest={onCreateRequest}
              onRenameEntry={onRenameEntry}
              onDeleteEntry={onDeleteEntry}
            />
          ))}
        </ul>
      ) : null}
    </li>
  );
}

export function TreeView({
  entries,
  rootPath,
  canMutate,
  onOpenRequest,
  onCreateFolder,
  onCreateRequest,
  onRenameEntry,
  onDeleteEntry,
  onRefresh
}: TreeViewProps) {
  return (
    <>
      <div className="tree-toolbar">
        <button
          disabled={!canMutate || !rootPath}
          onClick={() => {
            if (rootPath) {
              onCreateFolder(rootPath);
            }
          }}
          type="button"
        >
          New Folder
        </button>
        <button
          disabled={!canMutate || !rootPath}
          onClick={() => {
            if (rootPath) {
              onCreateRequest(rootPath);
            }
          }}
          type="button"
        >
          New Request
        </button>
        <button onClick={onRefresh} type="button">
          Refresh
        </button>
      </div>

      {entries.length === 0 ? (
        <div className="tree-empty">No collections or requests yet.</div>
      ) : (
        <ul className="tree-list">
          {entries.map((entry) => (
            <TreeNode
              key={entry.path}
              entry={entry}
              depth={0}
              onOpenRequest={onOpenRequest}
              onCreateFolder={onCreateFolder}
              onCreateRequest={onCreateRequest}
              onRenameEntry={onRenameEntry}
              onDeleteEntry={onDeleteEntry}
            />
          ))}
        </ul>
      )}
    </>
  );
}
