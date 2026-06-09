import { getDb } from '@/lib/db/client';
import { newId } from '@/lib/db/id';
import { mapSetRow } from '@/lib/db/map-row';
import { isoNow } from '@/lib/db/timestamps';
import type { SetRow } from '@/lib/db/row-types';
import type { Set, SetListFilters } from '@/types/domain';
import { isSetSessionLinkValid } from '@/types/set-validation';

export type CreateSetInput = {
  exerciseId: string;
  performedAt: string;
  sessionInstanceId?: string | null;
  sessionInstanceExerciseId?: string | null;
  sortOrder?: number | null;
  weight?: number | null;
  reps?: number | null;
  manufacturerId?: string | null;
  notes?: string | null;
};

export type UpdateSetInput = Partial<
  Omit<CreateSetInput, 'exerciseId'> & { exerciseId?: string }
>;

function buildFilterClause(
  filters: SetListFilters,
  alias = 's',
): { where: string; params: (string | number)[] } {
  const clauses: string[] = [];
  const params: (string | number)[] = [];

  if (filters.exerciseId) {
    clauses.push(`${alias}.exercise_id = ?`);
    params.push(filters.exerciseId);
  }
  if (filters.sessionInstanceId) {
    clauses.push(`${alias}.session_instance_id = ?`);
    params.push(filters.sessionInstanceId);
  }
  if (filters.performedAtFrom) {
    clauses.push(`${alias}.performed_at >= ?`);
    params.push(filters.performedAtFrom);
  }
  if (filters.performedAtTo) {
    clauses.push(`${alias}.performed_at < ?`);
    params.push(filters.performedAtTo);
  }
  if (filters.weightMin != null) {
    clauses.push(`${alias}.weight >= ?`);
    params.push(filters.weightMin);
  }
  if (filters.weightMax != null) {
    clauses.push(`${alias}.weight <= ?`);
    params.push(filters.weightMax);
  }
  if (filters.repsMin != null) {
    clauses.push(`${alias}.reps >= ?`);
    params.push(filters.repsMin);
  }
  if (filters.repsMax != null) {
    clauses.push(`${alias}.reps <= ?`);
    params.push(filters.repsMax);
  }

  return {
    where: clauses.length ? `WHERE ${clauses.join(' AND ')}` : '',
    params,
  };
}

export async function getSetById(id: string): Promise<Set | null> {
  const db = await getDb();
  const row = await db.getFirstAsync<SetRow>('SELECT * FROM sets WHERE id = ?', id);
  return row ? mapSetRow(row) : null;
}

export async function listSets(filters: SetListFilters = {}): Promise<Set[]> {
  const db = await getDb();
  const { where, params } = buildFilterClause(filters);
  const rows = await db.getAllAsync<SetRow>(
    `SELECT s.* FROM sets s ${where} ORDER BY s.performed_at DESC`,
    ...params,
  );
  return rows.map(mapSetRow);
}

export async function listSetsByExercise(
  exerciseId: string,
  filters: Omit<SetListFilters, 'exerciseId'> = {},
): Promise<Set[]> {
  return listSets({ ...filters, exerciseId });
}

export async function listSetsBySessionInstance(sessionInstanceId: string): Promise<Set[]> {
  return listSets({ sessionInstanceId });
}

export async function listSetsBySessionInstanceAndExercise(
  sessionInstanceId: string,
  exerciseId: string,
): Promise<Set[]> {
  return listSets({ sessionInstanceId, exerciseId });
}

export async function createSet(input: CreateSetInput): Promise<Set> {
  const instanceId = input.sessionInstanceId ?? null;
  const instanceExerciseId = input.sessionInstanceExerciseId ?? null;

  const draft: Set = {
    id: newId(),
    exerciseId: input.exerciseId,
    performedAt: input.performedAt,
    sessionInstanceId: instanceId,
    sessionInstanceExerciseId: instanceExerciseId,
    sortOrder: input.sortOrder ?? null,
    weight: input.weight ?? null,
    reps: input.reps ?? null,
    manufacturerId: input.manufacturerId ?? null,
    notes: input.notes ?? null,
    createdAt: isoNow(),
    updatedAt: isoNow(),
  };

  if (!isSetSessionLinkValid(draft)) {
    throw new Error('sessionInstanceExerciseId requires sessionInstanceId');
  }

  const db = await getDb();
  await db.runAsync(
    `INSERT INTO sets (
      id, exercise_id, performed_at,
      session_instance_id, session_instance_exercise_id,
      sort_order, weight, reps, manufacturer_id, notes, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    draft.id,
    draft.exerciseId,
    draft.performedAt,
    instanceId,
    instanceExerciseId,
    draft.sortOrder,
    draft.weight,
    draft.reps,
    draft.manufacturerId,
    draft.notes,
    draft.createdAt,
    draft.updatedAt,
  );

  return (await getSetById(draft.id))!;
}

export async function updateSet(id: string, input: UpdateSetInput): Promise<Set | null> {
  const existing = await getSetById(id);
  if (!existing) return null;

  const next: Set = {
    ...existing,
    ...input,
    updatedAt: isoNow(),
  };

  if (!isSetSessionLinkValid(next)) {
    throw new Error('sessionInstanceExerciseId requires sessionInstanceId');
  }

  const db = await getDb();
  await db.runAsync(
    `UPDATE sets SET
      exercise_id = ?, performed_at = ?,
      session_instance_id = ?, session_instance_exercise_id = ?,
      sort_order = ?, weight = ?, reps = ?, manufacturer_id = ?, notes = ?, updated_at = ?
     WHERE id = ?`,
    next.exerciseId,
    next.performedAt,
    next.sessionInstanceId,
    next.sessionInstanceExerciseId,
    next.sortOrder,
    next.weight,
    next.reps,
    next.manufacturerId,
    next.notes,
    next.updatedAt,
    id,
  );

  return getSetById(id);
}

export async function deleteSet(id: string): Promise<void> {
  const db = await getDb();
  await db.runAsync('DELETE FROM sets WHERE id = ?', id);
}

/** Most recent non-null manufacturer logged for this exercise (for form default). */
export async function getLastManufacturerIdForExercise(
  exerciseId: string,
): Promise<string | null> {
  const db = await getDb();
  const row = await db.getFirstAsync<{ manufacturer_id: string | null }>(
    `SELECT manufacturer_id FROM sets
     WHERE exercise_id = ? AND manufacturer_id IS NOT NULL
     ORDER BY performed_at DESC
     LIMIT 1`,
    exerciseId,
  );
  return row?.manufacturer_id ?? null;
}
