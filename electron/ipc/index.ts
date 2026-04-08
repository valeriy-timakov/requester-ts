import { registerAppStateHandlers } from './appState';
import { registerRequestAddAttachmentHandlers } from './request.addAttachment';
import { registerRequestExecutionHandlers } from './request.execute';
import { registerRequestRemoveAttachmentHandlers } from './request.removeAttachment';
import { registerRequestHandlers } from './requests';
import { registerTreeHandlers } from './tree';

export function registerIpcHandlers(): void {
  registerAppStateHandlers();
  registerTreeHandlers();
  registerRequestHandlers();
  registerRequestAddAttachmentHandlers();
  registerRequestRemoveAttachmentHandlers();
  registerRequestExecutionHandlers();
}
