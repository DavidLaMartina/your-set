import * as SetRepo from '@/lib/db/repositories/set-repository';
import * as InstanceExerciseRepo from '@/lib/db/repositories/session-instance-exercise-repository';
import { isoNow } from '@/lib/db/timestamps';
import type { Set, SetType } from '@/types/domain';

export type LogSetInput = {
  exerciseId: string;
  sessionInstanceId?: string | null;
  sessionInstanceExerciseId?: string | null;
  weight?: number | null;
  reps?: number | null;
  rir?: number | null;
  setType?: SetType;
  notes?: string | null;
  performedAt?: string;
  sortOrder?: number | null;
};

export type LogSetFormValues = {
  weight: string;
  reps: string;
  rir: string;
  setType: SetType;
  notes: string;
};

export function emptyLogSetForm(): LogSetFormValues {
  return {
    weight: '',
    reps: '',
    rir: '',
    setType: 'straight',
    notes: '',
  };
}

export function logSetFormFromSet(set: Set): LogSetFormValues {
  return {
    weight: set.weight != null ? String(set.weight) : '',
    reps: set.reps != null ? String(set.reps) : '',
    rir: set.rir != null ? String(set.rir) : '',
    setType: set.setType,
    notes: set.notes ?? '',
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
    rir: input.rir ?? null,
    setType: input.setType ?? 'straight',
    notes: input.notes ?? null,
  });
}

export async function updateLoggedSet(
  setId: string,
  input: Omit<LogSetInput, 'exerciseId' | 'performedAt' | 'sortOrder'> & {
    exerciseId?: string;
  },
): Promise<Set | null> {
  return SetRepo.updateSet(setId, {
    exerciseId: input.exerciseId,
    sessionInstanceId: input.sessionInstanceId,
    sessionInstanceExerciseId: input.sessionInstanceExerciseId,
    weight: input.weight,
    reps: input.reps,
    rir: input.rir,
    setType: input.setType,
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
    rir: parseOptionalInt(form.rir),
    setType: form.setType,
    notes: form.notes.trim() || null,
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
