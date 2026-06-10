import * as ImagePicker from 'expo-image-picker';
import * as MediaLibrary from 'expo-media-library';

export type PickedVideo = {
  /** MediaLibrary asset id; only present when library permission was granted. */
  assetId: string | null;
  uri: string;
  durationMs: number | null;
  width: number | null;
  height: number | null;
  /** ISO timestamp from the library asset's creation time, when available. */
  capturedAt: string | null;
};

export type PickVideoResult =
  | { ok: true; video: PickedVideo }
  | { ok: false; reason: 'canceled' | 'permissionDenied' };

/**
 * Launch the system library picker for a single video. Requesting library
 * permission first lets the result include `assetId`, which we need to
 * re-resolve / detect deletion later.
 */
export async function pickVideoFromLibrary(): Promise<PickVideoResult> {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) {
    return { ok: false, reason: 'permissionDenied' };
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['videos'],
    allowsMultipleSelection: false,
    quality: 1,
  });

  if (result.canceled || result.assets.length === 0) {
    return { ok: false, reason: 'canceled' };
  }

  const asset = result.assets[0];
  const assetId = asset.assetId ?? null;
  const capturedAt = await resolveCapturedAt(assetId);

  return {
    ok: true,
    video: {
      assetId,
      uri: asset.uri,
      durationMs: asset.duration ?? null,
      width: asset.width ?? null,
      height: asset.height ?? null,
      capturedAt,
    },
  };
}

/**
 * expo-media-library `creationTime` is **milliseconds** since epoch on both iOS
 * (timeIntervalSince1970 × 1000) and Android (MediaStore DATE_TAKEN). Do not
 * multiply again.
 */
function creationTimeToIso(creationTime: number): string | null {
  const ms = creationTime > 1e12 ? creationTime : creationTime * 1000;
  const date = new Date(ms);
  if (Number.isNaN(date.getTime())) return null;
  const year = date.getFullYear();
  const maxYear = new Date().getFullYear() + 1;
  if (year < 1990 || year > maxYear) return null;
  return date.toISOString();
}

/** Best-effort capture timestamp from the Photos asset metadata. */
async function resolveCapturedAt(assetId: string | null): Promise<string | null> {
  if (!assetId) return null;
  try {
    const info = await MediaLibrary.getAssetInfoAsync(assetId);
    if (info.creationTime > 0) {
      return creationTimeToIso(info.creationTime);
    }
  } catch {
    // Permission denied or asset gone — leave performedAt unchanged.
  }
  return null;
}
