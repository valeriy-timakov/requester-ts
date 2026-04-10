import path from 'path';

function normalizePath(filePath: string): string {
  return path.normalize(filePath).replace(/\\/g, '/');
}

export function isPathInsideRoot(rootPath: string, candidatePath: string): boolean {
  const normalizedRoot = normalizePath(path.resolve(rootPath));
  const normalizedCandidate = normalizePath(path.resolve(candidatePath));

  return (
    normalizedCandidate === normalizedRoot ||
    normalizedCandidate.startsWith(`${normalizedRoot}/`)
  );
}

export function resolvePathFromRoot(
  rootPath: string,
  inputPath: string
): string {
  return path.isAbsolute(inputPath)
    ? path.resolve(inputPath)
    : path.resolve(rootPath, inputPath);
}
