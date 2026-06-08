import * as MediaLibrary from 'expo-media-library';
import * as VideoThumbnails from 'expo-video-thumbnails';

import { persistedFileExists } from '@/lib/media/storage';
import type { SetVideo, VideoAvailabilityStatus } from '@/types/domain';

export type ResolvedAvailability = {
  status: VideoAvailabilityStatus;
  /** Freshly resolved playable URI when available. */
  uri?: string | null;
};

/**
 * Determine whether a stored video reference is still playable.
 *
 * - We attach a persistent copy in the document directory, so the primary check
 *   is simply whether that file still exists.
 * - As a fallback (e.g. a legacy row whose copy failed) we re-resolve through
 *   MediaLibrary by `assetId`, which also catches "deleted from Photos".
 *
 * Pass `requestPermission: true` from foreground screens (e.g. set detail) to
 * prompt when access hasn't been granted yet; list rendering should not prompt.
 */
export async function resolveVideoAvailability(
  video: Pick<SetVideo, 'assetId' | 'uri'>,
  options: { requestPermission?: boolean } = {},
): Promise<ResolvedAvailability> {
  if (video.uri && persistedFileExists(video.uri)) {
    return { status: 'available', uri: video.uri };
  }

  if (video.assetId) {
    const permission = options.requestPermission
      ? await MediaLibrary.requestPermissionsAsync()
      : await MediaLibrary.getPermissionsAsync();

    if (!permission.granted) {
      return { status: 'permissionDenied' };
    }

    try {
      const info = await MediaLibrary.getAssetInfoAsync(video.assetId);
      const uri = info?.localUri ?? info?.uri ?? null;
      if (uri) {
        return { status: 'available', uri };
      }
      return { status: 'missing' };
    } catch {
      return { status: 'missing' };
    }
  }

  return { status: video.uri ? 'missing' : 'unknown' };
}

/** Best-effort thumbnail; returns null on any failure (codec, permission, etc.). */
export async function generateThumbnail(uri: string): Promise<string | null> {
  try {
    const { uri: thumbnailUri } = await VideoThumbnails.getThumbnailAsync(uri, { time: 500 });
    return thumbnailUri;
  } catch {
    return null;
  }
}
