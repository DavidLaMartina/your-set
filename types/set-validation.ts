import type { Set } from '@/types/domain';

/** DB CHECK: workout_exercise_id requires workout_id; both null = set-only log. */
export function isSetSessionLinkValid(set: Pick<Set, 'workoutId' | 'workoutExerciseId'>): boolean {
  if (set.workoutExerciseId != null && set.workoutId == null) return false;
  return true;
}
