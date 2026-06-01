import type { Set } from '@/types/domain';

/** DB CHECK: sessionInstanceExerciseId requires sessionInstanceId; both null = set-only log. */
export function isSetSessionLinkValid(
  set: Pick<Set, 'sessionInstanceId' | 'sessionInstanceExerciseId'>,
): boolean {
  if (set.sessionInstanceExerciseId != null && set.sessionInstanceId == null) return false;
  return true;
}
