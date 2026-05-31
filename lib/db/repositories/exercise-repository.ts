import { getDb } from '@/lib/db/client';
import { newId } from '@/lib/db/id';
import { mapExerciseRow } from '@/lib/db/map-row';
import { isoNow } from '@/lib/db/timestamps';
import type { ExerciseRow } from '@/lib/db/row-types';
import type { Exercise } from '@/types/domain';

export type CreateExerciseInput = {
  name: string;
  defaultMuscleGroup?: string | null;
};

export type UpdateExerciseInput = {
  name?: string;
  defaultMuscleGroup?: string | null;
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

export async function createExercise(input: CreateExerciseInput): Promise<Exercise> {
  const db = await getDb();
  const now = isoNow();
  const id = newId();
  await db.runAsync(
    `INSERT INTO exercises (id, name, default_muscle_group, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?)`,
    id,
    input.name.trim(),
    input.defaultMuscleGroup ?? null,
    now,
    now,
  );
  return (await getExerciseById(id))!;
}

export async function updateExercise(id: string, input: UpdateExerciseInput): Promise<Exercise | null> {
  const existing = await getExerciseById(id);
  if (!existing) return null;

  const db = await getDb();
  const now = isoNow();
  await db.runAsync(
    `UPDATE exercises SET name = ?, default_muscle_group = ?, updated_at = ? WHERE id = ?`,
    input.name?.trim() ?? existing.name,
    input.defaultMuscleGroup !== undefined ? input.defaultMuscleGroup : existing.defaultMuscleGroup,
    now,
    id,
  );
  return getExerciseById(id);
}

export async function deleteExercise(id: string): Promise<void> {
  const db = await getDb();
  await db.runAsync('DELETE FROM exercises WHERE id = ?', id);
}
