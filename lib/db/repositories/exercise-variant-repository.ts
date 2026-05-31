import { getDb } from '@/lib/db/client';
import { newId } from '@/lib/db/id';
import { mapExerciseVariantRow } from '@/lib/db/map-row';
import { isoNow } from '@/lib/db/timestamps';
import type { ExerciseVariantRow } from '@/lib/db/row-types';
import type { ExerciseVariant } from '@/types/domain';

export type CreateVariantInput = {
  exerciseId: string;
  name: string;
  muscleGroup?: string | null;
  equipment?: string | null;
  setupNotes?: string | null;
};

export type UpdateVariantInput = {
  name?: string;
  muscleGroup?: string | null;
  equipment?: string | null;
  setupNotes?: string | null;
};

export async function listVariantsByExercise(exerciseId: string): Promise<ExerciseVariant[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<ExerciseVariantRow>(
    'SELECT * FROM exercise_variants WHERE exercise_id = ? ORDER BY name ASC',
    exerciseId,
  );
  return rows.map(mapExerciseVariantRow);
}

export async function getVariantById(id: string): Promise<ExerciseVariant | null> {
  const db = await getDb();
  const row = await db.getFirstAsync<ExerciseVariantRow>(
    'SELECT * FROM exercise_variants WHERE id = ?',
    id,
  );
  return row ? mapExerciseVariantRow(row) : null;
}

export async function createVariant(input: CreateVariantInput): Promise<ExerciseVariant> {
  const db = await getDb();
  const now = isoNow();
  const id = newId();
  await db.runAsync(
    `INSERT INTO exercise_variants
      (id, exercise_id, name, muscle_group, equipment, setup_notes, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    id,
    input.exerciseId,
    input.name.trim(),
    input.muscleGroup ?? null,
    input.equipment ?? null,
    input.setupNotes ?? null,
    now,
    now,
  );
  return (await getVariantById(id))!;
}

export async function updateVariant(
  id: string,
  input: UpdateVariantInput,
): Promise<ExerciseVariant | null> {
  const existing = await getVariantById(id);
  if (!existing) return null;

  const db = await getDb();
  const now = isoNow();
  await db.runAsync(
    `UPDATE exercise_variants
     SET name = ?, muscle_group = ?, equipment = ?, setup_notes = ?, updated_at = ?
     WHERE id = ?`,
    input.name?.trim() ?? existing.name,
    input.muscleGroup !== undefined ? input.muscleGroup : existing.muscleGroup,
    input.equipment !== undefined ? input.equipment : existing.equipment,
    input.setupNotes !== undefined ? input.setupNotes : existing.setupNotes,
    now,
    id,
  );
  return getVariantById(id);
}

export async function deleteVariant(id: string): Promise<void> {
  const db = await getDb();
  await db.runAsync('DELETE FROM exercise_variants WHERE id = ?', id);
}
