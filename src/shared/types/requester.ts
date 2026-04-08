export interface AppMetadata {
  lastOpenedRootFolder?: string;
}

export interface AppState {
  currentRootFolder: string;
}

export type TreeEntryType = 'folder' | 'request';

export interface TreeEntry {
  path: string;
  name: string;
  type: TreeEntryType;
  children?: TreeEntry[];
}

export type HttpMethod =
  | 'GET'
  | 'POST'
  | 'PUT'
  | 'PATCH'
  | 'DELETE'
  | 'HEAD'
  | 'OPTIONS';

export interface KeyValueEntry {
  key: string;
  value: string;
  enabled?: boolean;
}

export interface RequestAuthNone {
  type: 'none';
}

export interface RequestAuthBearer {
  type: 'bearer';
  token: string;
}

export interface RequestAuthBasic {
  type: 'basic';
  username: string;
  password: string;
}

export type RequestAuth =
  | RequestAuthNone
  | RequestAuthBearer
  | RequestAuthBasic;

export interface RequestBodyNone {
  type: 'none';
}

export interface RequestBodyText {
  type: 'text' | 'json' | 'xml';
  content: string;
}

export interface FormDataTextField {
  kind: 'text';
  key: string;
  value: string;
  enabled: boolean;
}

export interface FormDataFileField {
  kind: 'file';
  key: string;
  fileName: string;
  enabled: boolean;
}

export type FormDataField = FormDataTextField | FormDataFileField;

export interface RequestBodyFormData {
  type: 'form-data';
  fields: FormDataField[];
}

export type RequestBody =
  | RequestBodyNone
  | RequestBodyText
  | RequestBodyFormData;

export interface RequestOptions {
  followRedirects: boolean;
  timeoutMs?: number;
}

export interface RequestAttachment {
  fileName: string;
  relativePath: string;
  size: number;
}

export interface RequestFile {
  version: 1;
  name: string;
  method: HttpMethod;
  url: string;
  queryParams: KeyValueEntry[];
  headers: KeyValueEntry[];
  auth: RequestAuth;
  body: RequestBody;
  requestOptions: RequestOptions;
  attachments?: RequestAttachment[];
}

export interface RequestDocument {
  path: string;
  data: RequestFile;
  lastResponse?: RequestExecutionResponse | null;
}

export interface RequestFileError {
  code: 'INVALID_REQUEST_FILE';
  message: string;
}

export type RequestReadResult =
  | {
      ok: true;
      document: RequestDocument;
    }
  | {
      ok: false;
      error: RequestFileError;
    };

export interface RequestExecutionResponse {
  status: number;
  statusText: string;
  headers: Record<string, string>;
  body: string;
  durationMs: number;
  contentType?: string;
  bodySizeBytes?: number;
}

export interface OpenTab {
  path: string;
  title: string;
  isDirty: boolean;
  requestSnapshot: RequestFile;
}
