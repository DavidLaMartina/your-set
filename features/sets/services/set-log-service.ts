import { removeVideoFromSet } from '@/features/video/services/set-video-service';
import * as SetRepo from '@/lib/db/repositories/set-repository';
import * as InstanceExerciseRepo from '@/lib/db/repositories/session-instance-exercise-repository';
import * as SessionExerciseRepo from '@/lib/db/repositories/session-exercise-repository';
import * as SessionInstanceRepo from '@/lib/db/repositories/session-instance-repository';
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

export async function resolveManufacturerForWorkoutSet(
  exerciseId: string,
  sessionInstanceExerciseId: string,
): Promise<string | null> {
  const block = await InstanceExerciseRepo.getSessionInstanceExerciseById(
    sessionInstanceExerciseId,
  );
  if (!block) return defaultManufacturerForExercise(exerciseId);
  if (block.manufacturerId) return block.manufacturerId;

  const instance = await SessionInstanceRepo.getSessionInstanceById(block.sessionInstanceId);
  if (instance?.sessionId) {
    const planned = await SessionExerciseRepo.findSessionExerciseBySessionAndExercise(
      instance.sessionId,
      exerciseId,
    );
    if (planned?.manufacturerId) return planned.manufacturerId;
  }

  return defaultManufacturerForExercise(exerciseId);
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

  let manufacturerId = input.manufacturerId ?? null;
  if (
    manufacturerId == null &&
    input.sessionInstanceId &&
    input.sessionInstanceExerciseId
  ) {
    manufacturerId = await resolveManufacturerForWorkoutSet(
      input.exerciseId,
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
    manufacturerId,
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

async function defaultManufacturerForWorkoutBlock(
  sessionInstanceId: string,
  exerciseId: string,
): Promise<string | null> {
  const instance = await SessionInstanceRepo.getSessionInstanceById(sessionInstanceId);
  if (!instance?.sessionId) return null;
  const planned = await SessionExerciseRepo.findSessionExerciseBySessionAndExercise(
    instance.sessionId,
    exerciseId,
  );
  return planned?.manufacturerId ?? null;
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
    manufacturerId: await defaultManufacturerForWorkoutBlock(sessionInstanceId, exerciseId),
  });
  return block.id;
}

/** Default manufacturer for a new set: last logged for this exercise. */
export async function defaultManufacturerForExercise(
  exerciseId: string,
): Promise<string | null> {
  return SetRepo.getLastManufacturerIdForExercise(exerciseId);
}

/** Delete a set-only log and any attached video files. */
export async function deleteLoggedSet(setId: string): Promise<void> {
  const set = await SetRepo.getSetById(setId);
  if (!set) return;
  if (set.sessionInstanceId != null) {
    throw new Error('Cannot delete a set that belongs to a workout from this screen');
  }
  await removeVideoFromSet(setId);
  await SetRepo.deleteSet(setId);
}

/** Delete a set logged during a workout (from the workout screen only). */
export async function deleteWorkoutSet(
  setId: string,
  sessionInstanceId: string,
): Promise<void> {
  const set = await SetRepo.getSetById(setId);
  if (!set || set.sessionInstanceId !== sessionInstanceId) {
    throw new Error('Set does not belong to this workout');
  }
  await removeVideoFromSet(setId);
  await SetRepo.deleteSet(setId);
}
