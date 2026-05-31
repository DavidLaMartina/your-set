import * as ExerciseRepo from '@/lib/db/repositories/exercise-repository';
import * as VariantRepo from '@/lib/db/repositories/exercise-variant-repository';
import * as SetRepo from '@/lib/db/repositories/set-repository';
import * as WorkoutRepo from '@/lib/db/repositories/workout-repository';
import type { HistorySetRow, SetWithVideo, VariantHistoryView } from '@/types/domain';

async function enrichSetRow(set: Awaited<ReturnType<typeof SetRepo.getSetById>>): Promise<HistorySetRow | null> {
  if (!set) return null;
  let workoutName: string | null = null;
  if (set.workoutId) {
    const workout = await WorkoutRepo.getWorkoutById(set.workoutId);
    workoutName = workout?.name ?? 'Session';
  }
  const row: SetWithVideo = { ...set, video: null };
  return { ...row, workoutName };
}

export async function loadVariantHistory(variantId: string): Promise<VariantHistoryView | null> {
  const variant = await VariantRepo.getVariantById(variantId);
  if (!variant) return null;

  const exercise = await ExerciseRepo.getExerciseById(variant.exerciseId);
  if (!exercise) return null;

  const sets = await SetRepo.listSetsByVariant({ exerciseVariantId: variantId });
  const recentSets = (
    await Promise.all(sets.map((s) => enrichSetRow(s)))
  ).filter((r): r is HistorySetRow => r != null);

  const bestSets = [...recentSets]
    .sort((a, b) => (b.weight ?? 0) - (a.weight ?? 0))
    .slice(0, 3);

  const comparableSets = recentSets.filter((s) => s.setType === 'top_set').slice(0, 10);

  return { variant, exercise, recentSets, bestSets, comparableSets };
}

export async function loadSetWithContext(setId: string): Promise<HistorySetRow | null> {
  const set = await SetRepo.getSetById(setId);
  return enrichSetRow(set);
}
