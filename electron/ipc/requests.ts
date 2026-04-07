import { ipcMain } from 'electron';
import {
  readRequestFile,
  saveRequestFile
} from '../services/requestFileService';

export function registerRequestHandlers(): void {
  ipcMain.handle('requests:readRequest', async (_event, filePath: string) => {
    return {
      path: filePath,
      data: await readRequestFile(filePath)
    };
  });

  ipcMain.handle(
    'requests:saveRequest',
    async (_event, filePath: string, data) => {
      await saveRequestFile(filePath, data);
    }
  );
}
