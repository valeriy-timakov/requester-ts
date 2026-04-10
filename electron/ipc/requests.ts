import { ipcMain } from 'electron';
import path from 'path';
import {
  isPathInsideRoot,
  resolvePathFromRoot
} from '../services/pathSafety';
import { getCurrentRootFolder } from '../services/projectService';
import {
  readRequestDocument,
  saveRequestFile
} from '../services/requestFileService';

export function registerRequestHandlers(): void {
  ipcMain.handle('requests:readRequest', async (_event, filePath: string) => {
    try {
      const rootFolder = await getCurrentRootFolder();
      const absoluteFilePath = resolvePathFromRoot(rootFolder, filePath);

      if (!isPathInsideRoot(rootFolder, absoluteFilePath)) {
        throw new Error('Request path must be inside the current root folder.');
      }

      if (path.extname(absoluteFilePath).toLowerCase() !== '.req') {
        throw new Error('Only .req files can be opened.');
      }

      return await readRequestDocument(absoluteFilePath);
    } catch (error) {
      if ((error as NodeJS.ErrnoException)?.code === 'ENOENT') {
        throw new Error('Request file no longer exists.');
      }

      throw error;
    }
  });

  ipcMain.handle(
    'requests:saveRequest',
    async (_event, filePath: string, data) => {
      try {
        const rootFolder = await getCurrentRootFolder();
        const absoluteFilePath = resolvePathFromRoot(rootFolder, filePath);

        if (!isPathInsideRoot(rootFolder, absoluteFilePath)) {
          throw new Error('Request path must be inside the current root folder.');
        }

        if (path.extname(absoluteFilePath).toLowerCase() !== '.req') {
          throw new Error('Only .req files can be saved.');
        }

        await saveRequestFile(absoluteFilePath, data);
      } catch (error) {
        if ((error as NodeJS.ErrnoException)?.code === 'ENOENT') {
          throw new Error('Request file no longer exists.');
        }

        throw error;
      }
    }
  );
}
