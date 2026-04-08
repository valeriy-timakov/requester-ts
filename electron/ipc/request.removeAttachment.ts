import { ipcMain } from 'electron';
import path from 'path';
import { getCurrentRootFolder } from '../services/projectService';
import { removeAttachmentFromRequestFile } from '../services/requestFileService';

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

export function registerRequestRemoveAttachmentHandlers(): void {
  ipcMain.handle(
    'request:removeAttachment',
    async (
      _event,
      requestPath: string,
      attachmentRelativePath: string
    ) => {
      const rootFolder = await getCurrentRootFolder();
      const absoluteRequestPath = path.resolve(rootFolder, requestPath);

      if (!isPathInsideRoot(rootFolder, absoluteRequestPath)) {
        throw new Error('Request path must be inside the current root folder.');
      }

      if (path.extname(absoluteRequestPath).toLowerCase() !== '.req') {
        throw new Error('Only .req files can be updated.');
      }

      const data = await removeAttachmentFromRequestFile(
        absoluteRequestPath,
        attachmentRelativePath
      );

      return {
        path: absoluteRequestPath,
        data
      };
    }
  );
}
