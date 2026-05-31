import { getDb } from '@/lib/db/client';
import { newId } from '@/lib/db/id';
import { mapWorkoutExerciseRow } from '@/lib/db/map-row';
import { isoNow } from '@/lib/db/timestamps';
import type { WorkoutExerciseRow } from '@/lib/db/row-types';
import type { WorkoutExercise } from '@/types/domain';

export type CreateWorkoutExerciseInput = {
  workoutId: string;
  exerciseVariantId: string;
  sortOrder: number;
  notes?: string | null;
};

export async function listWorkoutExercises(workoutId: string): Promise<WorkoutExercise[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<WorkoutExerciseRow>(
    'SELECT * FROM workout_exercises WHERE workout_id = ? ORDER BY sort_order ASC',
    workoutId,
  );
  return rows.map(mapWorkoutExerciseRow);
}

export async function createWorkoutExercise(
  input: CreateWorkoutExerciseInput,
): Promise<WorkoutExercise> {
  const db = await getDb();
  const id = newId();
  const now = isoNow();
  await db.runAsync(
    `INSERT INTO workout_exercises
      (id, workout_id, exercise_variant_id, sort_order, notes, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    id,
    input.workoutId,
    input.exerciseVariantId,
    input.sortOrder,
    input.notes ?? null,
    now,
    now,
  );
  const row = await db.getFirstAsync<WorkoutExerciseRow>(
    'SELECT * FROM workout_exercises WHERE id = ?',
    id,
  );
  return mapWorkoutExerciseRow(row!);
}
