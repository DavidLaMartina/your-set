import * as ExerciseRepo from '@/lib/db/repositories/exercise-repository';
import * as VariantRepo from '@/lib/db/repositories/exercise-variant-repository';
import type { Exercise, ExerciseVariant } from '@/types/domain';

export type ExerciseWithVariants = {
  exercise: Exercise;
  variants: ExerciseVariant[];
};

export async function loadLibrary(): Promise<ExerciseWithVariants[]> {
  const exercises = await ExerciseRepo.listExercises();
  return Promise.all(
    exercises.map(async (exercise) => ({
      exercise,
      variants: await VariantRepo.listVariantsByExercise(exercise.id),
    })),
  );
}

export async function loadExerciseWithVariants(
  exerciseId: string,
): Promise<ExerciseWithVariants | null> {
  const exercise = await ExerciseRepo.getExerciseById(exerciseId);
  if (!exercise) return null;
  const variants = await VariantRepo.listVariantsByExercise(exerciseId);
  return { exercise, variants };
}

export { createExercise, updateExercise, deleteExercise } from '@/lib/db/repositories/exercise-repository';
export {
  createVariant,
  updateVariant,
  deleteVariant,
  getVariantById,
} from '@/lib/db/repositories/exercise-variant-repository';
