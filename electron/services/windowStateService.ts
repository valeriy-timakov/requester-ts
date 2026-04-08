const dirtyTabsByWebContentsId = new Map<number, boolean>();

export function setWindowHasDirtyTabs(
  webContentsId: number,
  hasDirtyTabs: boolean
): void {
  dirtyTabsByWebContentsId.set(webContentsId, hasDirtyTabs);
}

export function getWindowHasDirtyTabs(webContentsId: number): boolean {
  return dirtyTabsByWebContentsId.get(webContentsId) ?? false;
}

export function clearWindowState(webContentsId: number): void {
  dirtyTabsByWebContentsId.delete(webContentsId);
}
