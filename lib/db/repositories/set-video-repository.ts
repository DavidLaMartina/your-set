import { getDb } from '@/lib/db/client';
import { newId } from '@/lib/db/id';
import { mapSetVideoRow } from '@/lib/db/map-row';
import { isoNow } from '@/lib/db/timestamps';
import type { SetVideoRow } from '@/lib/db/row-types';
import type { CameraAngle, SetVideo, VideoAvailabilityStatus } from '@/types/domain';

export type UpsertSetVideoInput = {
  setId: string;
  assetId?: string | null;
  uri?: string | null;
  thumbnailUri?: string | null;
  durationMs?: number | null;
  width?: number | null;
  height?: number | null;
  cameraAngle?: CameraAngle | null;
  notes?: string | null;
  availabilityStatus?: VideoAvailabilityStatus;
};

export async function getSetVideoBySetId(setId: string): Promise<SetVideo | null> {
  const db = await getDb();
  const row = await db.getFirstAsync<SetVideoRow>(
    'SELECT * FROM set_videos WHERE set_id = ?',
    setId,
  );
  return row ? mapSetVideoRow(row) : null;
}

/** Fetch videos for many sets at once (list badges). Keyed by set_id. */
export async function listSetVideosBySetIds(setIds: string[]): Promise<Map<string, SetVideo>> {
  const result = new Map<string, SetVideo>();
  if (setIds.length === 0) return result;

  const db = await getDb();
  const placeholders = setIds.map(() => '?').join(', ');
  const rows = await db.getAllAsync<SetVideoRow>(
    `SELECT * FROM set_videos WHERE set_id IN (${placeholders})`,
    ...setIds,
  );
  for (const row of rows) {
    result.set(row.set_id, mapSetVideoRow(row));
  }
  return result;
}

/** Insert or replace the single video reference for a set (set_id is UNIQUE). */
export async function upsertSetVideo(input: UpsertSetVideoInput): Promise<SetVideo> {
  const db = await getDb();
  const now = isoNow();
  const existing = await getSetVideoBySetId(input.setId);
  const id = existing?.id ?? newId();
  const createdAt = existing?.createdAt ?? now;

  await db.runAsync(
    `INSERT INTO set_videos (
       id, set_id, asset_id, uri, thumbnail_uri, duration_ms, width, height,
       camera_angle, notes, availability_status, created_at, updated_at
     ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(set_id) DO UPDATE SET
       asset_id = excluded.asset_id,
       uri = excluded.uri,
       thumbnail_uri = excluded.thumbnail_uri,
       duration_ms = excluded.duration_ms,
       width = excluded.width,
       height = excluded.height,
       camera_angle = excluded.camera_angle,
       notes = excluded.notes,
       availability_status = excluded.availability_status,
       updated_at = excluded.updated_at`,
    id,
    input.setId,
    input.assetId ?? null,
    input.uri ?? null,
    input.thumbnailUri ?? null,
    input.durationMs ?? null,
    input.width ?? null,
    input.height ?? null,
    input.cameraAngle ?? null,
    input.notes ?? null,
    input.availabilityStatus ?? 'available',
    createdAt,
    now,
  );

  return (await getSetVideoBySetId(input.setId))!;
}

export async function updateSetVideoAvailability(
  setId: string,
  status: VideoAvailabilityStatus,
  patch: { uri?: string | null; thumbnailUri?: string | null } = {},
): Promise<void> {
  const db = await getDb();
  const sets: string[] = ['availability_status = ?', 'updated_at = ?'];
  const params: (string | null)[] = [status, isoNow()];

  if (patch.uri !== undefined) {
    sets.unshift('uri = ?');
    params.unshift(patch.uri);
  }
  if (patch.thumbnailUri !== undefined) {
    sets.unshift('thumbnail_uri = ?');
    params.unshift(patch.thumbnailUri);
  }

  await db.runAsync(`UPDATE set_videos SET ${sets.join(', ')} WHERE set_id = ?`, ...params, setId);
}

export async function deleteSetVideoBySetId(setId: string): Promise<void> {
  const db = await getDb();
  await db.runAsync('DELETE FROM set_videos WHERE set_id = ?', setId);
}
