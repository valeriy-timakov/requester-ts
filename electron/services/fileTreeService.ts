import { readdir } from 'fs/promises';
import path from 'path';
import type { TreeEntry } from '../../src/shared/types/requester';

function compareTreeEntries(left: TreeEntry, right: TreeEntry): number {
  if (left.type !== right.type) {
    return left.type === 'folder' ? -1 : 1;
  }

  return left.name.localeCompare(right.name, undefined, {
    sensitivity: 'base'
  });
}

async function readFolderEntries(folderPath: string): Promise<TreeEntry[]> {
  const directoryEntries = await readdir(folderPath, { withFileTypes: true });
  const treeEntries: TreeEntry[] = [];

  for (const directoryEntry of directoryEntries) {
    const entryPath = path.join(folderPath, directoryEntry.name);

    if (directoryEntry.isDirectory()) {
      treeEntries.push({
        path: entryPath,
        name: directoryEntry.name,
        type: 'folder',
        children: await readFolderEntries(entryPath)
      });
      continue;
    }

    if (
      directoryEntry.isFile() &&
      path.extname(directoryEntry.name) === '.req'
    ) {
      treeEntries.push({
        path: entryPath,
        name: path.basename(directoryEntry.name, '.req'),
        type: 'request'
      });
    }
  }

  return treeEntries.sort(compareTreeEntries);
}

export async function readTree(rootFolder: string): Promise<TreeEntry[]> {
  try {
    return readFolderEntries(rootFolder);
  } catch {
    return [];
  }
}
