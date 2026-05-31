import { getDb } from '@/lib/db/client';
import { mapExerciseRow, mapExerciseVariantRow } from '@/lib/db/map-row';
import type { Exercise, ExerciseVariant } from '@/types/domain';

export type VariantWithRecency = {
  variant: ExerciseVariant;
  lastPerformedAt: string | null;
};

export type ExerciseWithRecency = {
  exercise: Exercise;
  lastPerformedAt: string | null;
  variants: VariantWithRecency[];
};

export async function loadExercisesByRecency(): Promise<ExerciseWithRecency[]> {
  const db = await getDb();
  const exerciseRows = await db.getAllAsync<{
    id: string;
    name: string;
    default_muscle_group: string | null;
    created_at: string;
    updated_at: string;
  }>('SELECT * FROM exercises');

  const result: ExerciseWithRecency[] = [];

  for (const row of exerciseRows) {
    const exercise = mapExerciseRow(row);
    const variantRows = await db.getAllAsync<{
      id: string;
      exercise_id: string;
      name: string;
      muscle_group: string | null;
      equipment: string | null;
      setup_notes: string | null;
      created_at: string;
      updated_at: string;
    }>('SELECT * FROM exercise_variants WHERE exercise_id = ? ORDER BY name ASC', exercise.id);

    const variants: VariantWithRecency[] = [];
    let exerciseLast: string | null = null;

    for (const vRow of variantRows) {
      const variant = mapExerciseVariantRow(vRow);
      const lastRow = await db.getFirstAsync<{ last_performed: string | null }>(
        'SELECT MAX(performed_at) as last_performed FROM sets WHERE exercise_variant_id = ?',
        variant.id,
      );
      const lastPerformedAt = lastRow?.last_performed ?? null;
      if (lastPerformedAt && (!exerciseLast || lastPerformedAt > exerciseLast)) {
        exerciseLast = lastPerformedAt;
      }
      variants.push({ variant, lastPerformedAt });
    }

    variants.sort((a, b) => {
      if (!a.lastPerformedAt && !b.lastPerformedAt) return a.variant.name.localeCompare(b.variant.name);
      if (!a.lastPerformedAt) return 1;
      if (!b.lastPerformedAt) return -1;
      return b.lastPerformedAt.localeCompare(a.lastPerformedAt);
    });

    result.push({ exercise, lastPerformedAt: exerciseLast, variants });
  }

  result.sort((a, b) => {
    if (!a.lastPerformedAt && !b.lastPerformedAt) return a.exercise.name.localeCompare(b.exercise.name);
    if (!a.lastPerformedAt) return 1;
    if (!b.lastPerformedAt) return -1;
    return b.lastPerformedAt.localeCompare(a.lastPerformedAt);
  });

  return result;
}
