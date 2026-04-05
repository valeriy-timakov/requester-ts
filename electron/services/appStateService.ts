import { app } from 'electron';
import { mkdir, readFile, writeFile } from 'fs/promises';
import path from 'path';
import type { AppMetadata } from '../../src/shared/types/requester';

const METADATA_FILE_NAME = 'app-state.json';

function getMetadataFilePath(): string {
  return path.join(app.getPath('userData'), METADATA_FILE_NAME);
}

export async function readMetadata(): Promise<AppMetadata> {
  try {
    const content = await readFile(getMetadataFilePath(), 'utf8');
    const parsed = JSON.parse(content) as unknown;

    if (!parsed || typeof parsed !== 'object') {
      return {};
    }

    const { lastOpenedRootFolder } = parsed as AppMetadata;

    if (
      lastOpenedRootFolder !== undefined &&
      typeof lastOpenedRootFolder !== 'string'
    ) {
      return {};
    }

    return { lastOpenedRootFolder };
  } catch {
    return {};
  }
}

export async function writeMetadata(metadata: AppMetadata): Promise<void> {
  const metadataFilePath = getMetadataFilePath();

  await mkdir(path.dirname(metadataFilePath), { recursive: true });
  await writeFile(metadataFilePath, JSON.stringify(metadata, null, 2), 'utf8');
}

export async function updateLastOpenedRootFolder(
  lastOpenedRootFolder: string
): Promise<AppMetadata> {
  const nextMetadata: AppMetadata = { lastOpenedRootFolder };

  await writeMetadata(nextMetadata);

  return nextMetadata;
}
