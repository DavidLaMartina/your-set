import * as SetRepo from '@/lib/db/repositories/set-repository';
import * as InstanceExerciseRepo from '@/lib/db/repositories/session-instance-exercise-repository';
import { isoNow } from '@/lib/db/timestamps';
import type { Set } from '@/types/domain';

export type LogSetInput = {
  exerciseId: string;
  sessionInstanceId?: string | null;
  sessionInstanceExerciseId?: string | null;
  weight?: number | null;
  reps?: number | null;
  manufacturerId?: string | null;
  notes?: string | null;
  performedAt?: string;
  sortOrder?: number | null;
};

export type LogSetFormValues = {
  weight: string;
  reps: string;
  manufacturerId: string | null;
  notes: string;
  /** ISO timestamp; editable, defaults to now on create. */
  performedAt: string;
};

export function emptyLogSetForm(
  manufacturerId: string | null = null,
  performedAt: string = isoNow(),
): LogSetFormValues {
  return {
    weight: '',
    reps: '',
    manufacturerId,
    notes: '',
    performedAt,
  };
}

export function logSetFormFromSet(set: Set): LogSetFormValues {
  return {
    weight: set.weight != null ? String(set.weight) : '',
    reps: set.reps != null ? String(set.reps) : '',
    manufacturerId: set.manufacturerId,
    notes: set.notes ?? '',
    performedAt: set.performedAt,
  };
}

export function parseOptionalFloat(value: string): number | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const n = Number.parseFloat(trimmed);
  return Number.isFinite(n) ? n : null;
}

export function parseOptionalInt(value: string): number | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const n = Number.parseInt(trimmed, 10);
  return Number.isFinite(n) ? n : null;
}

export async function getNextSortOrderForBlock(
  sessionInstanceId: string,
  sessionInstanceExerciseId: string,
): Promise<number> {
  const sets = await SetRepo.listSets({ sessionInstanceId });
  const inBlock = sets.filter((s) => s.sessionInstanceExerciseId === sessionInstanceExerciseId);
  const max = inBlock.reduce((m, s) => Math.max(m, s.sortOrder ?? 0), 0);
  return max + 1;
}

export async function createLoggedSet(input: LogSetInput): Promise<Set> {
  let sortOrder = input.sortOrder ?? null;
  if (
    input.sessionInstanceId &&
    input.sessionInstanceExerciseId &&
    sortOrder == null
  ) {
    sortOrder = await getNextSortOrderForBlock(
      input.sessionInstanceId,
      input.sessionInstanceExerciseId,
    );
  }

  return SetRepo.createSet({
    exerciseId: input.exerciseId,
    performedAt: input.performedAt ?? isoNow(),
    sessionInstanceId: input.sessionInstanceId ?? null,
    sessionInstanceExerciseId: input.sessionInstanceExerciseId ?? null,
    sortOrder,
    weight: input.weight ?? null,
    reps: input.reps ?? null,
    manufacturerId: input.manufacturerId ?? null,
    notes: input.notes ?? null,
  });
}

export async function updateLoggedSet(
  setId: string,
  input: Omit<LogSetInput, 'sortOrder'> & { exerciseId?: string },
): Promise<Set | null> {
  return SetRepo.updateSet(setId, {
    exerciseId: input.exerciseId,
    performedAt: input.performedAt,
    sessionInstanceId: input.sessionInstanceId,
    sessionInstanceExerciseId: input.sessionInstanceExerciseId,
    weight: input.weight,
    reps: input.reps,
    manufacturerId: input.manufacturerId,
    notes: input.notes,
  });
}

export function formValuesToLogInput(
  form: LogSetFormValues,
  base: Pick<LogSetInput, 'exerciseId' | 'sessionInstanceId' | 'sessionInstanceExerciseId'>,
): LogSetInput {
  return {
    ...base,
    weight: parseOptionalFloat(form.weight),
    reps: parseOptionalInt(form.reps),
    manufacturerId: form.manufacturerId,
    notes: form.notes.trim() || null,
    performedAt: form.performedAt,
  };
}

export async function ensureWorkoutBlock(
  sessionInstanceId: string,
  exerciseId: string,
): Promise<string> {
  const existing = await InstanceExerciseRepo.findInstanceBlockByExercise(
    sessionInstanceId,
    exerciseId,
  );
  if (existing) return existing.id;

  const sortOrder = await InstanceExerciseRepo.getNextInstanceExerciseSortOrder(
    sessionInstanceId,
  );
  const block = await InstanceExerciseRepo.createSessionInstanceExercise({
    sessionInstanceId,
    exerciseId,
    sortOrder,
  });
  return block.id;
}

/** Default manufacturer for a new set: last logged for this exercise. */
export async function defaultManufacturerForExercise(
  exerciseId: string,
): Promise<string | null> {
  return SetRepo.getLastManufacturerIdForExercise(exerciseId);
}
