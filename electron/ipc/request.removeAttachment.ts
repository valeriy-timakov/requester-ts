import { ipcMain } from 'electron';
import path from 'path';
import { getCurrentRootFolder } from '../services/projectService';
import {
  isPathInsideRoot,
  resolvePathFromRoot
} from '../services/pathSafety';
import { removeAttachmentFromRequestFile } from '../services/requestFileService';

export function registerRequestRemoveAttachmentHandlers(): void {
  ipcMain.handle(
    'request:removeAttachment',
    async (
      _event,
      requestPath: string,
      attachmentRelativePath: string
    ) => {
      const rootFolder = await getCurrentRootFolder();
      const absoluteRequestPath = resolvePathFromRoot(rootFolder, requestPath);

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
