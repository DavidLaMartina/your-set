import * as SessionExerciseRepo from '@/lib/db/repositories/session-exercise-repository';
import * as ExerciseRepo from '@/lib/db/repositories/exercise-repository';
import type { SessionExercise } from '@/types/domain';

export type PlannedExerciseRow = SessionExercise & {
  exerciseName: string;
};

export async function loadPlannedExercises(sessionId: string): Promise<PlannedExerciseRow[]> {
  const exercises = await SessionExerciseRepo.listSessionExercises(sessionId);
  const rows: PlannedExerciseRow[] = [];
  for (const row of exercises) {
    const exercise = await ExerciseRepo.getExerciseById(row.exerciseId);
    rows.push({
      ...row,
      exerciseName: exercise?.name ?? 'Unknown exercise',
    });
  }
  return rows;
}

export async function addExerciseToSession(
  sessionId: string,
  exerciseId: string,
): Promise<SessionExercise | null> {
  if (await SessionExerciseRepo.sessionHasExercise(sessionId, exerciseId)) {
    return null;
  }
  const sortOrder = await SessionExerciseRepo.getNextSessionExerciseSortOrder(sessionId);
  return SessionExerciseRepo.createSessionExercise({
    sessionId,
    exerciseId,
    sortOrder,
  });
}

export async function removePlannedExercise(plannedExerciseId: string): Promise<void> {
  await SessionExerciseRepo.deleteSessionExercise(plannedExerciseId);
}

export async function movePlannedExercise(
  sessionId: string,
  plannedExerciseId: string,
  direction: 'up' | 'down',
): Promise<void> {
  const list = await SessionExerciseRepo.listSessionExercises(sessionId);
  const index = list.findIndex((r) => r.id === plannedExerciseId);
  if (index < 0) return;

  const swapIndex = direction === 'up' ? index - 1 : index + 1;
  if (swapIndex < 0 || swapIndex >= list.length) return;

  const current = list[index];
  const other = list[swapIndex];
  await SessionExerciseRepo.updateSessionExerciseSortOrder(current.id, other.sortOrder);
  await SessionExerciseRepo.updateSessionExerciseSortOrder(other.id, current.sortOrder);
}
