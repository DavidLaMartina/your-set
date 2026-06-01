import { getDb } from '@/lib/db/client';
import { newId } from '@/lib/db/id';
import { mapSessionExerciseRow } from '@/lib/db/map-row';
import { isoNow } from '@/lib/db/timestamps';
import type { SessionExerciseRow } from '@/lib/db/row-types';
import type { SessionExercise } from '@/types/domain';

export type CreateSessionExerciseInput = {
  sessionId: string;
  exerciseVariantId: string;
  sortOrder: number;
  targetSets?: number | null;
  targetRepsMin?: number | null;
  targetRepsMax?: number | null;
  targetWeight?: number | null;
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
      id, session_id, exercise_variant_id, sort_order,
      target_sets, target_reps_min, target_reps_max, target_weight, prescription_notes,
      created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    id,
    input.sessionId,
    input.exerciseVariantId,
    input.sortOrder,
    input.targetSets ?? null,
    input.targetRepsMin ?? null,
    input.targetRepsMax ?? null,
    input.targetWeight ?? null,
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
