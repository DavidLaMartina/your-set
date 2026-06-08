import { getDb } from '@/lib/db/client';
import { mapSetRow } from '@/lib/db/map-row';
import * as ExerciseRepo from '@/lib/db/repositories/exercise-repository';
import * as ReferenceRepo from '@/lib/db/repositories/reference-repository';
import * as SessionRepo from '@/lib/db/repositories/session-repository';
import * as SessionInstanceRepo from '@/lib/db/repositories/session-instance-repository';
import * as SetVideoRepo from '@/lib/db/repositories/set-video-repository';
import type { SetRow } from '@/lib/db/row-types';
import type { Set, SetVideo, SetWithVideo } from '@/types/domain';

export type RecentSetRow = SetWithVideo & {
  exerciseName: string;
  manufacturerName: string | null;
  sessionName: string | null;
};

export async function listRecentSets(limit = 80): Promise<RecentSetRow[]> {
  const db = await getDb();
  const [rows, manufacturers] = await Promise.all([
    db.getAllAsync<SetRow>(`SELECT * FROM sets ORDER BY performed_at DESC LIMIT ?`, limit),
    ReferenceRepo.listManufacturers(),
  ]);
  const manufacturerNames = new Map(manufacturers.map((m) => [m.id, m.name]));
  const sets = rows.map(mapSetRow);
  const videos = await SetVideoRepo.listSetVideosBySetIds(sets.map((s) => s.id));

  return Promise.all(sets.map((set) => enrichSetRow(set, manufacturerNames, videos)));
}

async function enrichSetRow(
  set: Set,
  manufacturerNames: Map<string, string>,
  videos: Map<string, SetVideo>,
): Promise<RecentSetRow> {
  const exercise = await ExerciseRepo.getExerciseById(set.exerciseId);

  let sessionName: string | null = null;
  if (set.sessionInstanceId) {
    const instance = await SessionInstanceRepo.getSessionInstanceById(set.sessionInstanceId);
    if (instance?.sessionId) {
      const session = await SessionRepo.getSessionById(instance.sessionId);
      sessionName = session?.name ?? null;
    }
  }

  return {
    ...set,
    video: videos.get(set.id) ?? null,
    exerciseName: exercise?.name ?? 'Unknown',
    manufacturerName: set.manufacturerId
      ? manufacturerNames.get(set.manufacturerId) ?? null
      : null,
    sessionName,
  };
}
