import { dialog } from 'electron';

export async function openAttachmentFilesDialog(): Promise<string[]> {
  const result = await dialog.showOpenDialog({
    title: 'Select Attachment Files',
    properties: ['openFile', 'multiSelections']
  });

  if (result.canceled || result.filePaths.length === 0) {
    return [];
  }

  return result.filePaths;
}
