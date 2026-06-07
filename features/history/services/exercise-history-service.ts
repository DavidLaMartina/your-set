import * as ExerciseRepo from '@/lib/db/repositories/exercise-repository';
import * as ReferenceRepo from '@/lib/db/repositories/reference-repository';
import * as SessionRepo from '@/lib/db/repositories/session-repository';
import * as SessionInstanceRepo from '@/lib/db/repositories/session-instance-repository';
import * as SetRepo from '@/lib/db/repositories/set-repository';
import type { ExerciseHistoryView, HistorySetRow, SetWithVideo } from '@/types/domain';

async function enrichSetRow(
  set: Awaited<ReturnType<typeof SetRepo.getSetById>>,
  manufacturerNames: Map<string, string>,
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
  const row: SetWithVideo = { ...set, video: null };
  const manufacturerName = set.manufacturerId
    ? manufacturerNames.get(set.manufacturerId) ?? null
    : null;
  return { ...row, sessionName, manufacturerName };
}

export async function loadExerciseHistory(exerciseId: string): Promise<ExerciseHistoryView | null> {
  const exercise = await ExerciseRepo.getExerciseWithMeta(exerciseId);
  if (!exercise) return null;

  const [sets, manufacturers] = await Promise.all([
    SetRepo.listSetsByExercise(exerciseId),
    ReferenceRepo.listManufacturers(),
  ]);
  const manufacturerNames = new Map(manufacturers.map((m) => [m.id, m.name]));

  const recentSets = (
    await Promise.all(sets.map((s) => enrichSetRow(s, manufacturerNames)))
  ).filter((r): r is HistorySetRow => r != null);

  const bestSets = [...recentSets]
    .sort((a, b) => (b.weight ?? 0) - (a.weight ?? 0))
    .slice(0, 3);

  const comparableSets = recentSets.filter((s) => s.setType === 'top_set').slice(0, 10);

  return { exercise, recentSets, bestSets, comparableSets };
}

export async function loadSetWithContext(setId: string): Promise<HistorySetRow | null> {
  const [set, manufacturers] = await Promise.all([
    SetRepo.getSetById(setId),
    ReferenceRepo.listManufacturers(),
  ]);
  const manufacturerNames = new Map(manufacturers.map((m) => [m.id, m.name]));
  return enrichSetRow(set, manufacturerNames);
}
