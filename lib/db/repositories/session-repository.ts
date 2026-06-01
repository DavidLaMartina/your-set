import { getDb } from '@/lib/db/client';
import { newId } from '@/lib/db/id';
import { mapSessionRow } from '@/lib/db/map-row';
import { isoNow } from '@/lib/db/timestamps';
import type { SessionRow } from '@/lib/db/row-types';
import type { Session, SessionStatus } from '@/types/domain';

export type CreateSessionInput = {
  name: string;
  status?: SessionStatus;
  rotationSortOrder?: number | null;
  notes?: string | null;
};

export type UpdateSessionInput = Partial<CreateSessionInput>;

export async function getSessionById(id: string): Promise<Session | null> {
  const db = await getDb();
  const row = await db.getFirstAsync<SessionRow>('SELECT * FROM sessions WHERE id = ?', id);
  return row ? mapSessionRow(row) : null;
}

export async function listSessionsByStatus(status: SessionStatus): Promise<Session[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<SessionRow>(
    `SELECT * FROM sessions
     WHERE status = ?
     ORDER BY rotation_sort_order IS NULL, rotation_sort_order ASC, name ASC`,
    status,
  );
  return rows.map(mapSessionRow);
}

export async function createSession(input: CreateSessionInput): Promise<Session> {
  const id = newId();
  const now = isoNow();
  const db = await getDb();
  await db.runAsync(
    `INSERT INTO sessions (id, name, status, rotation_sort_order, notes, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    id,
    input.name,
    input.status ?? 'active',
    input.rotationSortOrder ?? null,
    input.notes ?? null,
    now,
    now,
  );
  return (await getSessionById(id))!;
}

export async function updateSession(id: string, input: UpdateSessionInput): Promise<Session | null> {
  const existing = await getSessionById(id);
  if (!existing) return null;

  const next = {
    name: input.name ?? existing.name,
    status: input.status ?? existing.status,
    rotationSortOrder:
      input.rotationSortOrder !== undefined ? input.rotationSortOrder : existing.rotationSortOrder,
    notes: input.notes !== undefined ? input.notes : existing.notes,
    updatedAt: isoNow(),
  };

  const db = await getDb();
  await db.runAsync(
    `UPDATE sessions SET name = ?, status = ?, rotation_sort_order = ?, notes = ?, updated_at = ?
     WHERE id = ?`,
    next.name,
    next.status,
    next.rotationSortOrder,
    next.notes,
    next.updatedAt,
    id,
  );
  return getSessionById(id);
}

export async function deleteSession(id: string): Promise<void> {
  const db = await getDb();
  await db.runAsync('DELETE FROM sessions WHERE id = ?', id);
}

export async function getNextRotationSortOrder(): Promise<number> {
  const db = await getDb();
  const row = await db.getFirstAsync<{ max_order: number | null }>(
    'SELECT MAX(rotation_sort_order) as max_order FROM sessions WHERE status = ?',
    'active',
  );
  return (row?.max_order ?? -1) + 1;
}
