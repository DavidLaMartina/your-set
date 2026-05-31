/**
 * Canonical SQL patterns for the three access modes.
 * Repositories (Phase 2+) should compose these with bound parameters.
 */

/** 1. All sets for a variant (session optional), with filters on performed_at, load, reps. */
export const SQL_SETS_BY_VARIANT = `
SELECT s.*
FROM sets s
WHERE s.exercise_variant_id = ?
  AND (? IS NULL OR s.performed_at >= ?)
  AND (? IS NULL OR s.performed_at < ?)
  AND (? IS NULL OR s.weight >= ?)
  AND (? IS NULL OR s.weight <= ?)
  AND (? IS NULL OR s.reps >= ?)
  AND (? IS NULL OR s.reps <= ?)
ORDER BY s.performed_at DESC;
`;

/** 1b. All sets for any variant under a parent exercise. */
export const SQL_SETS_BY_EXERCISE = `
SELECT s.*
FROM sets s
INNER JOIN exercise_variants ev ON ev.id = s.exercise_variant_id
WHERE ev.exercise_id = ?
  AND (? IS NULL OR s.performed_at >= ?)
  AND (? IS NULL OR s.performed_at < ?)
ORDER BY s.performed_at DESC;
`;

/** 2. All sets in a session (session-first). */
export const SQL_SETS_BY_WORKOUT = `
SELECT s.*
FROM sets s
WHERE s.workout_id = ?
ORDER BY s.performed_at ASC, s.sort_order ASC;
`;

/** 2b. Exercise blocks in a session (layout / block notes). */
export const SQL_WORKOUT_EXERCISES_BY_WORKOUT = `
SELECT we.*
FROM workout_exercises we
WHERE we.workout_id = ?
ORDER BY we.sort_order ASC;
`;

/** 3. Sets for a variant within a specific session. */
export const SQL_SETS_BY_WORKOUT_AND_VARIANT = `
SELECT s.*
FROM sets s
WHERE s.workout_id = ?
  AND s.exercise_variant_id = ?
ORDER BY s.performed_at ASC, s.sort_order ASC;
`;

/** Open sessions (ended_at optional forever). */
export const SQL_OPEN_WORKOUTS = `
SELECT w.*
FROM workouts w
WHERE w.ended_at IS NULL
ORDER BY w.started_at DESC;
`;
