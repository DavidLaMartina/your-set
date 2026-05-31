/** Stable mock IDs for Phase 1 navigation and deep links */

export const MOCK_IDS = {
  workoutActive: 'workout-active-1',
  blockSmithIncline: 'we-smith-incline',
  blockCableRow: 'we-cable-row',
  variantSmithIncline: 'variant-smith-incline',
  variantCableRow: 'variant-cable-row',
  exerciseInclinePress: 'exercise-incline-press',
  exerciseRow: 'exercise-row',
  setTodayTop: 'set-today-top',
  setTodayBackoff: 'set-today-backoff',
  setTodayMissingVideo: 'set-today-missing',
  setPriorCompare: 'set-prior-compare',
  setHistory1: 'set-history-1',
  setHistory2: 'set-history-2',
  /** Logged without a session (set-only user path) */
  setOrphanSmith: 'set-orphan-smith',
} as const;
