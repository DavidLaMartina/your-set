import { Directory, File, Paths } from 'expo-file-system';

const VIDEO_DIR = 'set-videos';

function ensureVideoDir(): Directory {
  const dir = new Directory(Paths.document, VIDEO_DIR);
  if (!dir.exists) {
    dir.create({ intermediates: true });
  }
  return dir;
}

function extensionFromUri(uri: string, fallback: string): string {
  const match = /\.([a-zA-Z0-9]+)(?:[?#].*)?$/.exec(uri);
  return match ? match[1].toLowerCase() : fallback;
}

/**
 * Copy a picked video into the app's document directory so it survives reloads
 * and Photos changes. The picker hands back a file in the (clearable) cache
 * directory, so the original URI is not safe to persist. Returns the stable URI.
 */
export function persistVideoFile(sourceUri: string, id: string): string {
  const dir = ensureVideoDir();
  const dest = new File(dir, `${id}.${extensionFromUri(sourceUri, 'mov')}`);
  if (dest.exists) dest.delete();
  new File(sourceUri).copy(dest);
  return dest.uri;
}

/** Persist a generated thumbnail (also lives in cache by default). Best-effort. */
export function persistThumbnailFile(sourceUri: string, id: string): string | null {
  try {
    const dir = ensureVideoDir();
    const dest = new File(dir, `${id}-thumb.${extensionFromUri(sourceUri, 'jpg')}`);
    if (dest.exists) dest.delete();
    new File(sourceUri).copy(dest);
    return dest.uri;
  } catch {
    return null;
  }
}

export function persistedFileExists(uri: string): boolean {
  try {
    return new File(uri).exists;
  } catch {
    return false;
  }
}

export function deletePersistedFile(uri: string | null | undefined): void {
  if (!uri) return;
  try {
    const file = new File(uri);
    if (file.exists) file.delete();
  } catch {
    // ignore — file may already be gone
  }
}
