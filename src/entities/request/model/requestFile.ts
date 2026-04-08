import type { HttpMethod, RequestFile } from '@/shared/types/requester';

export const HTTP_METHODS: HttpMethod[] = [
  'GET',
  'POST',
  'PUT',
  'PATCH',
  'DELETE',
  'HEAD',
  'OPTIONS'
];

export function cloneRequestFile(requestFile: RequestFile): RequestFile {
  return JSON.parse(JSON.stringify(requestFile)) as RequestFile;
}

export function areRequestFilesEqual(
  left: RequestFile,
  right: RequestFile
): boolean {
  return JSON.stringify(left) === JSON.stringify(right);
}
