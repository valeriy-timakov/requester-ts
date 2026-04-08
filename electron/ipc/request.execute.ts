import { ipcMain } from 'electron';
import path from 'path';
import { executeRequest } from '../services/httpClient';
import {
  readRequestFile,
  saveResponseFile
} from '../services/requestFileService';
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

export function registerRequestExecutionHandlers(): void {
  ipcMain.handle('request:execute', async (_event, relativePath: string) => {
    const rootFolder = await getCurrentRootFolder();
    const requestPath = path.resolve(rootFolder, relativePath);

    if (!isPathInsideRoot(rootFolder, requestPath)) {
      throw new Error('Request path must be inside the current root folder.');
    }

    if (path.extname(requestPath).toLowerCase() !== '.req') {
      throw new Error('Only .req files can be executed.');
    }

    const request = await readRequestFile(requestPath);
    const response = await executeRequest(request);
    await saveResponseFile(requestPath, response);
    return response;
  });
}
