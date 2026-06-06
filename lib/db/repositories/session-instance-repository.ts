import { getDb } from '@/lib/db/client';
import { newId } from '@/lib/db/id';
import { mapSessionInstanceRow } from '@/lib/db/map-row';
import { isoNow } from '@/lib/db/timestamps';
import type { SessionInstanceRow } from '@/lib/db/row-types';
import type { SessionInstance } from '@/types/domain';

export type CreateSessionInstanceInput = {
  sessionId?: string | null;
  startedAt?: string;
  bodyweight?: number | null;
  notes?: string | null;
};

export async function getSessionInstanceById(id: string): Promise<SessionInstance | null> {
  const db = await getDb();
  const row = await db.getFirstAsync<SessionInstanceRow>(
    'SELECT * FROM session_instances WHERE id = ?',
    id,
  );
  return row ? mapSessionInstanceRow(row) : null;
}

export async function listOpenSessionInstances(): Promise<SessionInstance[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<SessionInstanceRow>(
    'SELECT * FROM session_instances WHERE ended_at IS NULL ORDER BY started_at DESC',
  );
  return rows.map(mapSessionInstanceRow);
}

export async function createSessionInstance(
  input: CreateSessionInstanceInput = {},
): Promise<SessionInstance> {
  const id = newId();
  const now = isoNow();
  const startedAt = input.startedAt ?? now;
  const db = await getDb();
  await db.runAsync(
    `INSERT INTO session_instances (
      id, session_id, started_at, ended_at, bodyweight, notes, created_at, updated_at
    ) VALUES (?, ?, ?, NULL, ?, ?, ?, ?)`,
    id,
    input.sessionId ?? null,
    startedAt,
    input.bodyweight ?? null,
    input.notes ?? null,
    now,
    now,
  );
  return (await getSessionInstanceById(id))!;
}

export async function deleteSessionInstance(id: string): Promise<void> {
  const db = await getDb();
  // Unlink sets first. Relying on the two ON DELETE SET NULL cascades
  // (session_instance_id from this row, session_instance_exercise_id from the
  // cascade-deleted blocks) can transiently violate the sets CHECK constraint
  // depending on the order SQLite applies them. Nulling both in one update
  // keeps the sets in the log, unlinked, and avoids that.
  await db.runAsync(
    'UPDATE sets SET session_instance_id = NULL, session_instance_exercise_id = NULL WHERE session_instance_id = ?',
    id,
  );
  await db.runAsync('DELETE FROM session_instances WHERE id = ?', id);
}

export async function endSessionInstance(
  id: string,
  endedAt: string = isoNow(),
): Promise<SessionInstance | null> {
  const db = await getDb();
  const now = isoNow();
  await db.runAsync(
    'UPDATE session_instances SET ended_at = ?, updated_at = ? WHERE id = ?',
    endedAt,
    now,
    id,
  );
  return getSessionInstanceById(id);
}
