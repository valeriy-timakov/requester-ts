import { ipcMain } from 'electron';
import {
  readRequestDocument,
  saveRequestFile
} from '../services/requestFileService';

export function registerRequestHandlers(): void {
  ipcMain.handle('requests:readRequest', async (_event, filePath: string) => {
    try {
      return await readRequestDocument(filePath);
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
        await saveRequestFile(filePath, data);
      } catch (error) {
        if ((error as NodeJS.ErrnoException)?.code === 'ENOENT') {
          throw new Error('Request file no longer exists.');
        }

        throw error;
      }
    }
  );
}
