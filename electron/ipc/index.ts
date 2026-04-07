import { registerAppStateHandlers } from './appState';
import { registerRequestHandlers } from './requests';
import { registerTreeHandlers } from './tree';

export function registerIpcHandlers(): void {
  registerAppStateHandlers();
  registerTreeHandlers();
  registerRequestHandlers();
}
