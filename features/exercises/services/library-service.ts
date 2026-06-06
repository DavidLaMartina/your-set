import * as ExerciseRepo from '@/lib/db/repositories/exercise-repository';
import * as ReferenceRepo from '@/lib/db/repositories/reference-repository';
import type { Exercise, Implement, Manufacturer, Muscle } from '@/types/domain';

export type ExerciseLibraryRow = {
  exercise: Exercise;
  implementName: string | null;
  primaryMuscleName: string | null;
};

/** Flat list of exercises for the picker, with reference labels resolved. */
export async function loadLibrary(): Promise<ExerciseLibraryRow[]> {
  const [exercises, implements_, muscles] = await Promise.all([
    ExerciseRepo.listExercises(),
    ReferenceRepo.listImplements(),
    ReferenceRepo.listMuscles(),
  ]);
  const implementById = new Map(implements_.map((i) => [i.id, i.name]));
  const muscleById = new Map(muscles.map((m) => [m.id, m.name]));

  return exercises.map((exercise) => ({
    exercise,
    implementName: exercise.implementId ? implementById.get(exercise.implementId) ?? null : null,
    primaryMuscleName: exercise.primaryMuscleId
      ? muscleById.get(exercise.primaryMuscleId) ?? null
      : null,
  }));
}

export type ExerciseFormOptions = {
  implements: Implement[];
  muscles: Muscle[];
  manufacturers: Manufacturer[];
};

export async function loadExerciseFormOptions(): Promise<ExerciseFormOptions> {
  const [implements_, muscles, manufacturers] = await Promise.all([
    ReferenceRepo.listImplements(),
    ReferenceRepo.listMuscles(),
    ReferenceRepo.listManufacturers(),
  ]);
  return { implements: implements_, muscles, manufacturers };
}

export {
  createExercise,
  updateExercise,
  deleteExercise,
  getExerciseById,
  getExerciseWithMeta,
} from '@/lib/db/repositories/exercise-repository';
