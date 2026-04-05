import type { TreeEntry } from '@/shared/types/requester';

interface TreeViewProps {
  entries: TreeEntry[];
}

function TreeNode({ entry, depth }: { entry: TreeEntry; depth: number }) {
  const paddingLeft = 12 + depth * 16;

  if (entry.type === 'request') {
    return (
      <li>
        <div className="tree-node tree-node--request" style={{ paddingLeft }}>
          <span className="tree-node__icon">REQ</span>
          <span>{entry.name}</span>
        </div>
      </li>
    );
  }

  return (
    <li>
      <div className="tree-node tree-node--folder" style={{ paddingLeft }}>
        <span className="tree-node__icon">DIR</span>
        <span>{entry.name}</span>
      </div>
      {entry.children && entry.children.length > 0 ? (
        <ul className="tree-list">
          {entry.children.map((childEntry) => (
            <TreeNode key={childEntry.path} entry={childEntry} depth={depth + 1} />
          ))}
        </ul>
      ) : null}
    </li>
  );
}

export function TreeView({ entries }: TreeViewProps) {
  if (entries.length === 0) {
    return <div className="tree-empty">No folders or request files found.</div>;
  }

  return (
    <ul className="tree-list">
      {entries.map((entry) => (
        <TreeNode key={entry.path} entry={entry} depth={0} />
      ))}
    </ul>
  );
}
