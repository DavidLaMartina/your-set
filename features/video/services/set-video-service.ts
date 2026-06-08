import { generateThumbnail, resolveVideoAvailability } from '@/lib/media/availability';
import { pickVideoFromLibrary } from '@/lib/media/picker';
import {
  deletePersistedFile,
  persistThumbnailFile,
  persistVideoFile,
} from '@/lib/media/storage';
import { newId } from '@/lib/db/id';
import * as SetVideoRepo from '@/lib/db/repositories/set-video-repository';
import type { SetVideo } from '@/types/domain';

export type AttachVideoResult =
  | { ok: true; video: SetVideo }
  | { ok: false; reason: 'canceled' | 'permissionDenied' };

/**
 * Pick a video from the library and store a persistent copy + reference for the
 * set. Used for both the initial attach and relink (set_id is unique, so this
 * replaces any existing reference). The picked file lives in the clearable
 * cache directory, so we copy it into the document directory to survive reloads.
 */
export async function attachVideoToSet(setId: string): Promise<AttachVideoResult> {
  const picked = await pickVideoFromLibrary();
  if (!picked.ok) return picked;

  const { video } = picked;
  const previous = await SetVideoRepo.getSetVideoBySetId(setId);

  const fileId = newId();
  let persistentUri = video.uri;
  try {
    persistentUri = persistVideoFile(video.uri, fileId);
  } catch {
    // Fall back to the original URI; availability resolution will flag it if it
    // later becomes unreadable.
  }

  const rawThumbnail = await generateThumbnail(persistentUri);
  const thumbnailUri = rawThumbnail ? persistThumbnailFile(rawThumbnail.uri, fileId) : null;

  const saved = await SetVideoRepo.upsertSetVideo({
    setId,
    assetId: video.assetId,
    uri: persistentUri,
    thumbnailUri,
    durationMs: video.durationMs,
    // Prefer the thumbnail's display-corrected dimensions; the picker reports
    // rotated portrait videos with swapped (landscape) width/height.
    width: rawThumbnail?.width ?? video.width,
    height: rawThumbnail?.height ?? video.height,
    availabilityStatus: 'available',
  });

  if (previous?.uri && previous.uri !== persistentUri) deletePersistedFile(previous.uri);
  if (previous?.thumbnailUri && previous.thumbnailUri !== thumbnailUri) {
    deletePersistedFile(previous.thumbnailUri);
  }

  return { ok: true, video: saved };
}

export async function removeVideoFromSet(setId: string): Promise<void> {
  const existing = await SetVideoRepo.getSetVideoBySetId(setId);
  await SetVideoRepo.deleteSetVideoBySetId(setId);
  deletePersistedFile(existing?.uri);
  deletePersistedFile(existing?.thumbnailUri);
}

export async function loadSetVideo(setId: string): Promise<SetVideo | null> {
  return SetVideoRepo.getSetVideoBySetId(setId);
}

/**
 * Re-check a set's video and persist the result. Call from foreground screens.
 */
export async function resolveAndPersistSetVideo(setId: string): Promise<SetVideo | null> {
  const video = await SetVideoRepo.getSetVideoBySetId(setId);
  if (!video) return null;

  const resolved = await resolveVideoAvailability(video, { requestPermission: true });
  if (resolved.status === video.availabilityStatus && resolved.uri == null) {
    return video;
  }

  await SetVideoRepo.updateSetVideoAvailability(setId, resolved.status, {
    uri: resolved.uri ?? video.uri,
  });
  return SetVideoRepo.getSetVideoBySetId(setId);
}
