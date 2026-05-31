import { getDb } from '@/lib/db/client';
import { newId } from '@/lib/db/id';
import { mapSetRow } from '@/lib/db/map-row';
import { isoNow } from '@/lib/db/timestamps';
import type { SetRow } from '@/lib/db/row-types';
import type { Set, SetListFilters, SetType } from '@/types/domain';
import { isSetSessionLinkValid } from '@/types/set-validation';

export type CreateSetInput = {
  exerciseVariantId: string;
  performedAt: string;
  workoutId?: string | null;
  workoutExerciseId?: string | null;
  sortOrder?: number | null;
  weight?: number | null;
  reps?: number | null;
  rir?: number | null;
  isFailure?: boolean;
  setType?: SetType;
  notes?: string | null;
};

export type UpdateSetInput = Partial<
  Omit<CreateSetInput, 'exerciseVariantId'> & { exerciseVariantId?: string }
>;

function buildFilterClause(
  filters: SetListFilters,
  alias = 's',
): { where: string; params: (string | number)[] } {
  const clauses: string[] = [];
  const params: (string | number)[] = [];

  if (filters.exerciseVariantId) {
    clauses.push(`${alias}.exercise_variant_id = ?`);
    params.push(filters.exerciseVariantId);
  }
  if (filters.workoutId) {
    clauses.push(`${alias}.workout_id = ?`);
    params.push(filters.workoutId);
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
  if (filters.setTypes?.length) {
    const placeholders = filters.setTypes.map(() => '?').join(', ');
    clauses.push(`${alias}.set_type IN (${placeholders})`);
    params.push(...filters.setTypes);
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

export async function listSetsByVariant(filters: SetListFilters): Promise<Set[]> {
  if (!filters.exerciseVariantId) {
    throw new Error('listSetsByVariant requires exerciseVariantId');
  }
  return listSets(filters);
}

export async function listSetsByExercise(
  exerciseId: string,
  filters: Omit<SetListFilters, 'exerciseId' | 'exerciseVariantId'> = {},
): Promise<Set[]> {
  const db = await getDb();
  const clauses = ['ev.exercise_id = ?'];
  const params: (string | number)[] = [exerciseId];

  const extra = buildFilterClause({ ...filters, exerciseVariantId: undefined });
  if (extra.where) {
    const extraClauses = extra.where.replace(/^WHERE /, '').split(' AND ');
    clauses.push(...extraClauses);
    params.push(...extra.params);
  }

  const rows = await db.getAllAsync<SetRow>(
    `SELECT s.* FROM sets s
     INNER JOIN exercise_variants ev ON ev.id = s.exercise_variant_id
     WHERE ${clauses.join(' AND ')}
     ORDER BY s.performed_at DESC`,
    ...params,
  );
  return rows.map(mapSetRow);
}

export async function listSetsByWorkout(workoutId: string): Promise<Set[]> {
  return listSets({ workoutId });
}

export async function listSetsByWorkoutAndVariant(
  workoutId: string,
  exerciseVariantId: string,
): Promise<Set[]> {
  return listSets({ workoutId, exerciseVariantId });
}

export async function createSet(input: CreateSetInput): Promise<Set> {
  const draft: Set = {
    id: newId(),
    exerciseVariantId: input.exerciseVariantId,
    performedAt: input.performedAt,
    workoutId: input.workoutId ?? null,
    workoutExerciseId: input.workoutExerciseId ?? null,
    sortOrder: input.sortOrder ?? null,
    weight: input.weight ?? null,
    reps: input.reps ?? null,
    rir: input.rir ?? null,
    isFailure: input.isFailure ?? false,
    setType: input.setType ?? 'straight',
    notes: input.notes ?? null,
    createdAt: isoNow(),
    updatedAt: isoNow(),
  };

  if (!isSetSessionLinkValid(draft)) {
    throw new Error('workoutExerciseId requires workoutId');
  }

  const db = await getDb();
  await db.runAsync(
    `INSERT INTO sets (
      id, exercise_variant_id, performed_at, workout_id, workout_exercise_id,
      sort_order, weight, reps, rir, is_failure, set_type, notes, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    draft.id,
    draft.exerciseVariantId,
    draft.performedAt,
    draft.workoutId,
    draft.workoutExerciseId,
    draft.sortOrder,
    draft.weight,
    draft.reps,
    draft.rir,
    draft.isFailure ? 1 : 0,
    draft.setType,
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
    throw new Error('workoutExerciseId requires workoutId');
  }

  const db = await getDb();
  await db.runAsync(
    `UPDATE sets SET
      exercise_variant_id = ?, performed_at = ?, workout_id = ?, workout_exercise_id = ?,
      sort_order = ?, weight = ?, reps = ?, rir = ?, is_failure = ?, set_type = ?, notes = ?, updated_at = ?
     WHERE id = ?`,
    next.exerciseVariantId,
    next.performedAt,
    next.workoutId,
    next.workoutExerciseId,
    next.sortOrder,
    next.weight,
    next.reps,
    next.rir,
    next.isFailure ? 1 : 0,
    next.setType,
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
