import { ipcMain } from 'electron';
import path from 'path';
import { openAttachmentFilesDialog } from '../services/dialogService';
import { addAttachmentToRequestFile } from '../services/requestFileService';
import { getCurrentRootFolder } from '../services/projectService';

function normalizePath(filePath: string): string {
  return path.normalize(filePath).replace(/\\/g, '/');
}

function isPathInsideRoot(rootPath: string, candidatePath: string): boolean {
  const normalizedRoot = normalizePath(path.resolve(rootPath));
  const normalizedCandidate = normalizePath(path.resolve(candidatePath));

  return (
    normalizedCandidate === normalizedRoot ||
    normalizedCandidate.startsWith(`${normalizedRoot}/`)
  );
}

export function registerRequestAddAttachmentHandlers(): void {
  ipcMain.handle('request:addAttachment', async (_event, requestPath: string) => {
    const rootFolder = await getCurrentRootFolder();
    const absoluteRequestPath = path.resolve(rootFolder, requestPath);

    if (!isPathInsideRoot(rootFolder, absoluteRequestPath)) {
      throw new Error('Request path must be inside the current root folder.');
    }

    if (path.extname(absoluteRequestPath).toLowerCase() !== '.req') {
      throw new Error('Only .req files can be updated.');
    }

    const selectedFilePaths = await openAttachmentFilesDialog();
    if (selectedFilePaths.length === 0) {
      return null;
    }

    let nextRequest = await addAttachmentToRequestFile(
      absoluteRequestPath,
      selectedFilePaths[0]
    );
    for (const selectedFilePath of selectedFilePaths.slice(1)) {
      nextRequest = await addAttachmentToRequestFile(
        absoluteRequestPath,
        selectedFilePath
      );
    }

    return {
      path: absoluteRequestPath,
      data: nextRequest
    };
  });
}
