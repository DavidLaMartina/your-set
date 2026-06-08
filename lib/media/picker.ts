import * as ImagePicker from 'expo-image-picker';

export type PickedVideo = {
  /** MediaLibrary asset id; only present when library permission was granted. */
  assetId: string | null;
  uri: string;
  durationMs: number | null;
  width: number | null;
  height: number | null;
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
  return {
    ok: true,
    video: {
      assetId: asset.assetId ?? null,
      uri: asset.uri,
      durationMs: asset.duration ?? null,
      width: asset.width ?? null,
      height: asset.height ?? null,
    },
  };
}
