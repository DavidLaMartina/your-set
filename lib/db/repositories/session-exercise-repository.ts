import { getDb } from '@/lib/db/client';
import { newId } from '@/lib/db/id';
import { mapSessionExerciseRow } from '@/lib/db/map-row';
import { isoNow } from '@/lib/db/timestamps';
import type { SessionExerciseRow } from '@/lib/db/row-types';
import type { SessionExercise } from '@/types/domain';

export type CreateSessionExerciseInput = {
  sessionId: string;
  exerciseId: string;
  sortOrder: number;
  targetSets?: number | null;
  targetRepsMin?: number | null;
  targetRepsMax?: number | null;
  targetWeight?: number | null;
  manufacturerId?: string | null;
  prescriptionNotes?: string | null;
};

export async function listSessionExercises(sessionId: string): Promise<SessionExercise[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<SessionExerciseRow>(
    'SELECT * FROM session_exercises WHERE session_id = ? ORDER BY sort_order ASC',
    sessionId,
  );
  return rows.map(mapSessionExerciseRow);
}

export async function createSessionExercise(
  input: CreateSessionExerciseInput,
): Promise<SessionExercise> {
  const id = newId();
  const now = isoNow();
  const db = await getDb();
  await db.runAsync(
    `INSERT INTO session_exercises (
      id, session_id, exercise_id, sort_order,
      target_sets, target_reps_min, target_reps_max, target_weight, manufacturer_id,
      prescription_notes, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    id,
    input.sessionId,
    input.exerciseId,
    input.sortOrder,
    input.targetSets ?? null,
    input.targetRepsMin ?? null,
    input.targetRepsMax ?? null,
    input.targetWeight ?? null,
    input.manufacturerId ?? null,
    input.prescriptionNotes ?? null,
    now,
    now,
  );
  const row = await db.getFirstAsync<SessionExerciseRow>(
    'SELECT * FROM session_exercises WHERE id = ?',
    id,
  );
  return mapSessionExerciseRow(row!);
}

export async function getSessionExerciseById(id: string): Promise<SessionExercise | null> {
  const db = await getDb();
  const row = await db.getFirstAsync<SessionExerciseRow>(
    'SELECT * FROM session_exercises WHERE id = ?',
    id,
  );
  return row ? mapSessionExerciseRow(row) : null;
}

export async function deleteSessionExercise(id: string): Promise<void> {
  const db = await getDb();
  await db.runAsync('DELETE FROM session_exercises WHERE id = ?', id);
}

export async function updateSessionExerciseSortOrder(
  id: string,
  sortOrder: number,
): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    'UPDATE session_exercises SET sort_order = ?, updated_at = ? WHERE id = ?',
    sortOrder,
    isoNow(),
    id,
  );
}

export async function getNextSessionExerciseSortOrder(sessionId: string): Promise<number> {
  const db = await getDb();
  const row = await db.getFirstAsync<{ max_order: number | null }>(
    'SELECT MAX(sort_order) as max_order FROM session_exercises WHERE session_id = ?',
    sessionId,
  );
  return (row?.max_order ?? -1) + 1;
}

export async function updateSessionExerciseManufacturer(
  id: string,
  manufacturerId: string | null,
): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    'UPDATE session_exercises SET manufacturer_id = ?, updated_at = ? WHERE id = ?',
    manufacturerId,
    isoNow(),
    id,
  );
}

export async function findSessionExerciseBySessionAndExercise(
  sessionId: string,
  exerciseId: string,
): Promise<SessionExercise | null> {
  const db = await getDb();
  const row = await db.getFirstAsync<SessionExerciseRow>(
    'SELECT * FROM session_exercises WHERE session_id = ? AND exercise_id = ?',
    sessionId,
    exerciseId,
  );
  return row ? mapSessionExerciseRow(row) : null;
}

export async function sessionHasExercise(
  sessionId: string,
  exerciseId: string,
): Promise<boolean> {
  const db = await getDb();
  const row = await db.getFirstAsync<{ count: number }>(
    'SELECT COUNT(*) as count FROM session_exercises WHERE session_id = ? AND exercise_id = ?',
    sessionId,
    exerciseId,
  );
  return (row?.count ?? 0) > 0;
}
