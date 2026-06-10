import type { SetVideo } from '@/types/domain';

type SetDeleteShape = {
  notes: string | null;
  video: SetVideo | null;
};

/** Confirm before delete when the set has more than weight × reps. */
export function setDeleteNeedsConfirmation(set: SetDeleteShape): boolean {
  if (set.notes?.trim()) return true;
  if (set.video != null) return true;
  return false;
}
