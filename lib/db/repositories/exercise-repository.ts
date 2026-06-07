import { getDb } from '@/lib/db/client';
import { newId } from '@/lib/db/id';
import { mapExerciseRow, mapMuscleRow } from '@/lib/db/map-row';
import { isoNow } from '@/lib/db/timestamps';
import type { ExerciseRow, MuscleRow } from '@/lib/db/row-types';
import type { Exercise, ExerciseOrigin, ExerciseWithMeta, Muscle } from '@/types/domain';

export type CreateExerciseInput = {
  name: string;
  implementId?: string | null;
  primaryMuscleId?: string | null;
  origin?: ExerciseOrigin;
  catalogId?: string | null;
  notes?: string | null;
  secondaryMuscleIds?: string[];
};

export type UpdateExerciseInput = {
  name?: string;
  implementId?: string | null;
  primaryMuscleId?: string | null;
  notes?: string | null;
  secondaryMuscleIds?: string[];
};

export async function listExercises(): Promise<Exercise[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<ExerciseRow>('SELECT * FROM exercises ORDER BY name ASC');
  return rows.map(mapExerciseRow);
}

export async function getExerciseById(id: string): Promise<Exercise | null> {
  const db = await getDb();
  const row = await db.getFirstAsync<ExerciseRow>('SELECT * FROM exercises WHERE id = ?', id);
  return row ? mapExerciseRow(row) : null;
}

export async function getSecondaryMuscles(exerciseId: string): Promise<Muscle[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<MuscleRow>(
    `SELECT m.* FROM exercise_secondary_muscles esm
     INNER JOIN muscles m ON m.id = esm.muscle_id
     WHERE esm.exercise_id = ?
     ORDER BY m.sort_order ASC, m.name ASC`,
    exerciseId,
  );
  return rows.map(mapMuscleRow);
}

/** Exercise joined with reference names + secondary muscles for display. */
export async function getExerciseWithMeta(id: string): Promise<ExerciseWithMeta | null> {
  const db = await getDb();
  const row = await db.getFirstAsync<
    ExerciseRow & {
      implement_name: string | null;
      muscle_name: string | null;
    }
  >(
    `SELECT e.*,
            i.name AS implement_name,
            m.name AS muscle_name
     FROM exercises e
     LEFT JOIN implements i ON i.id = e.implement_id
     LEFT JOIN muscles m ON m.id = e.primary_muscle_id
     WHERE e.id = ?`,
    id,
  );
  if (!row) return null;

  const secondaryMuscles = await getSecondaryMuscles(id);
  return {
    ...mapExerciseRow(row),
    implementName: row.implement_name,
    primaryMuscleName: row.muscle_name,
    secondaryMuscles,
  };
}

async function replaceSecondaryMuscles(exerciseId: string, muscleIds: string[]): Promise<void> {
  const db = await getDb();
  await db.runAsync('DELETE FROM exercise_secondary_muscles WHERE exercise_id = ?', exerciseId);
  for (const muscleId of muscleIds) {
    if (muscleId === '') continue;
    await db.runAsync(
      'INSERT OR IGNORE INTO exercise_secondary_muscles (exercise_id, muscle_id) VALUES (?, ?)',
      exerciseId,
      muscleId,
    );
  }
}

export async function createExercise(input: CreateExerciseInput): Promise<Exercise> {
  const db = await getDb();
  const now = isoNow();
  const id = newId();
  await db.runAsync(
    `INSERT INTO exercises
      (id, name, implement_id, primary_muscle_id, origin, catalog_id, notes, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    id,
    input.name.trim(),
    input.implementId ?? null,
    input.primaryMuscleId ?? null,
    input.origin ?? 'custom',
    input.catalogId ?? null,
    input.notes ?? null,
    now,
    now,
  );
  if (input.secondaryMuscleIds?.length) {
    await replaceSecondaryMuscles(id, input.secondaryMuscleIds);
  }
  return (await getExerciseById(id))!;
}

export async function updateExercise(
  id: string,
  input: UpdateExerciseInput,
): Promise<Exercise | null> {
  const existing = await getExerciseById(id);
  if (!existing) return null;

  const db = await getDb();
  const now = isoNow();
  await db.runAsync(
    `UPDATE exercises
     SET name = ?, implement_id = ?, primary_muscle_id = ?, notes = ?, updated_at = ?
     WHERE id = ?`,
    input.name?.trim() ?? existing.name,
    input.implementId !== undefined ? input.implementId : existing.implementId,
    input.primaryMuscleId !== undefined ? input.primaryMuscleId : existing.primaryMuscleId,
    input.notes !== undefined ? input.notes : existing.notes,
    now,
    id,
  );
  if (input.secondaryMuscleIds !== undefined) {
    await replaceSecondaryMuscles(id, input.secondaryMuscleIds);
  }
  return getExerciseById(id);
}

export async function deleteExercise(id: string): Promise<void> {
  const db = await getDb();
  await db.runAsync('DELETE FROM exercises WHERE id = ?', id);
}
