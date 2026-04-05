import { registerAppStateHandlers } from './appState';
import { registerTreeHandlers } from './tree';

export function registerIpcHandlers(): void {
  registerAppStateHandlers();
  registerTreeHandlers();
}
