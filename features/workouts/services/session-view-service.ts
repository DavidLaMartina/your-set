import * as ExerciseRepo from '@/lib/db/repositories/exercise-repository';
import * as VariantRepo from '@/lib/db/repositories/exercise-variant-repository';
import * as SetRepo from '@/lib/db/repositories/set-repository';
import * as WorkoutRepo from '@/lib/db/repositories/workout-repository';
import * as WorkoutExerciseRepo from '@/lib/db/repositories/workout-exercise-repository';
import type { ActiveWorkoutView, SetWithVideo, WorkoutExerciseBlock } from '@/types/domain';

async function enrichBlock(
  workoutId: string,
  block: Awaited<ReturnType<typeof WorkoutExerciseRepo.listWorkoutExercises>>[number],
): Promise<WorkoutExerciseBlock | null> {
  const variant = await VariantRepo.getVariantById(block.exerciseVariantId);
  if (!variant) return null;

  const exercise = await ExerciseRepo.getExerciseById(variant.exerciseId);
  if (!exercise) return null;

  const sets = await SetRepo.listSetsByWorkoutAndVariant(workoutId, block.exerciseVariantId);
  const setsWithVideo: SetWithVideo[] = sets.map((set) => ({ ...set, video: null }));

  return {
    ...block,
    variant,
    exercise,
    sets: setsWithVideo,
  };
}

export async function loadSessionView(sessionId: string): Promise<ActiveWorkoutView | null> {
  const workout = await WorkoutRepo.getWorkoutById(sessionId);
  if (!workout) return null;

  const blocks = await WorkoutExerciseRepo.listWorkoutExercises(workout.id);
  const enriched = (
    await Promise.all(blocks.map((block) => enrichBlock(workout.id, block)))
  ).filter((b): b is WorkoutExerciseBlock => b != null);

  return { ...workout, blocks: enriched };
}
