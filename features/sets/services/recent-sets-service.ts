import * as ExerciseRepo from '@/lib/db/repositories/exercise-repository';
import * as ReferenceRepo from '@/lib/db/repositories/reference-repository';
import * as SessionRepo from '@/lib/db/repositories/session-repository';
import * as SessionInstanceRepo from '@/lib/db/repositories/session-instance-repository';
import * as SetRepo from '@/lib/db/repositories/set-repository';
import * as SetVideoRepo from '@/lib/db/repositories/set-video-repository';
import type { Set, SetListFilters, SetVideo, SetWithVideo } from '@/types/domain';

export type RecentSetRow = SetWithVideo & {
  exerciseName: string;
  manufacturerName: string | null;
  sessionName: string | null;
};

export type ListRecentSetsOptions = SetListFilters & {
  limit?: number;
};

export async function listRecentSets(options: ListRecentSetsOptions = {}): Promise<RecentSetRow[]> {
  const { limit = 80, ...filters } = options;
  const [sets, manufacturers] = await Promise.all([
    SetRepo.listSets(filters, { limit }),
    ReferenceRepo.listManufacturers(),
  ]);
  const manufacturerNames = new Map(manufacturers.map((m) => [m.id, m.name]));
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
