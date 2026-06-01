import { getDb } from '@/lib/db/client';
import { newId } from '@/lib/db/id';
import { mapSessionInstanceExerciseRow } from '@/lib/db/map-row';
import { isoNow } from '@/lib/db/timestamps';
import type { SessionInstanceExerciseRow } from '@/lib/db/row-types';
import type { SessionInstanceExercise } from '@/types/domain';

export type CreateSessionInstanceExerciseInput = {
  sessionInstanceId: string;
  exerciseVariantId: string;
  sortOrder: number;
  notes?: string | null;
};

export async function listSessionInstanceExercises(
  sessionInstanceId: string,
): Promise<SessionInstanceExercise[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<SessionInstanceExerciseRow>(
    'SELECT * FROM session_instance_exercises WHERE session_instance_id = ? ORDER BY sort_order ASC',
    sessionInstanceId,
  );
  return rows.map(mapSessionInstanceExerciseRow);
}

export async function createSessionInstanceExercise(
  input: CreateSessionInstanceExerciseInput,
): Promise<SessionInstanceExercise> {
  const id = newId();
  const now = isoNow();
  const db = await getDb();
  await db.runAsync(
    `INSERT INTO session_instance_exercises (
      id, session_instance_id, exercise_variant_id, sort_order, notes, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
    id,
    input.sessionInstanceId,
    input.exerciseVariantId,
    input.sortOrder,
    input.notes ?? null,
    now,
    now,
  );
  const row = await db.getFirstAsync<SessionInstanceExerciseRow>(
    'SELECT * FROM session_instance_exercises WHERE id = ?',
    id,
  );
  return mapSessionInstanceExerciseRow(row!);
}
