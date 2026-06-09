import * as ExerciseRepo from '@/lib/db/repositories/exercise-repository';
import * as ReferenceRepo from '@/lib/db/repositories/reference-repository';
import * as SessionRepo from '@/lib/db/repositories/session-repository';
import * as SessionInstanceRepo from '@/lib/db/repositories/session-instance-repository';
import * as SetRepo from '@/lib/db/repositories/set-repository';
import * as SetVideoRepo from '@/lib/db/repositories/set-video-repository';
import type { ExerciseHistoryView, HistorySetRow, Set, SetVideo } from '@/types/domain';

async function enrichSetRow(
  set: Set | null,
  manufacturerNames: Map<string, string>,
  videos: Map<string, SetVideo>,
): Promise<HistorySetRow | null> {
  if (!set) return null;
  let sessionName: string | null = null;
  if (set.sessionInstanceId) {
    const instance = await SessionInstanceRepo.getSessionInstanceById(set.sessionInstanceId);
    if (instance?.sessionId) {
      const session = await SessionRepo.getSessionById(instance.sessionId);
      sessionName = session?.name ?? 'Session';
    } else {
      sessionName = 'Session';
    }
  }
  const manufacturerName = set.manufacturerId
    ? manufacturerNames.get(set.manufacturerId) ?? null
    : null;
  return { ...set, video: videos.get(set.id) ?? null, sessionName, manufacturerName };
}

export async function loadExerciseHistory(exerciseId: string): Promise<ExerciseHistoryView | null> {
  const exercise = await ExerciseRepo.getExerciseWithMeta(exerciseId);
  if (!exercise) return null;

  const [sets, manufacturers] = await Promise.all([
    SetRepo.listSetsByExercise(exerciseId),
    ReferenceRepo.listManufacturers(),
  ]);
  const manufacturerNames = new Map(manufacturers.map((m) => [m.id, m.name]));
  const videos = await SetVideoRepo.listSetVideosBySetIds(sets.map((s) => s.id));

  const recentSets = (
    await Promise.all(sets.map((s) => enrichSetRow(s, manufacturerNames, videos)))
  ).filter((r): r is HistorySetRow => r != null);

  const byWeightThenReps = [...recentSets].sort(
    (a, b) => (b.weight ?? 0) - (a.weight ?? 0) || (b.reps ?? 0) - (a.reps ?? 0),
  );
  const bestSets = byWeightThenReps.slice(0, 3);
  const comparableSets = byWeightThenReps.slice(0, 10);

  return { exercise, recentSets, bestSets, comparableSets };
}

export async function loadSetWithContext(setId: string): Promise<HistorySetRow | null> {
  const [set, manufacturers, video] = await Promise.all([
    SetRepo.getSetById(setId),
    ReferenceRepo.listManufacturers(),
    SetVideoRepo.getSetVideoBySetId(setId),
  ]);
  const manufacturerNames = new Map(manufacturers.map((m) => [m.id, m.name]));
  const videos = new Map<string, SetVideo>();
  if (video) videos.set(video.setId, video);
  return enrichSetRow(set, manufacturerNames, videos);
}
