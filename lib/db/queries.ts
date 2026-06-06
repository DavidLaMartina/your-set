/**
 * Canonical SQL patterns for the three access modes.
 * Repositories compose these with bound parameters.
 */

/** 1. All sets for an exercise (session optional), with filters on performed_at, load, reps. */
export const SQL_SETS_BY_EXERCISE = `
SELECT s.*
FROM sets s
WHERE s.exercise_id = ?
  AND (? IS NULL OR s.performed_at >= ?)
  AND (? IS NULL OR s.performed_at < ?)
  AND (? IS NULL OR s.weight >= ?)
  AND (? IS NULL OR s.weight <= ?)
  AND (? IS NULL OR s.reps >= ?)
  AND (? IS NULL OR s.reps <= ?)
ORDER BY s.performed_at DESC;
`;

/** 2. All sets in a session instance (session-first). */
export const SQL_SETS_BY_SESSION_INSTANCE = `
SELECT s.*
FROM sets s
WHERE s.session_instance_id = ?
ORDER BY s.performed_at ASC, s.sort_order ASC;
`;

/** 2b. Exercise blocks in a session instance. */
export const SQL_INSTANCE_EXERCISES_BY_INSTANCE = `
SELECT sie.*
FROM session_instance_exercises sie
WHERE sie.session_instance_id = ?
ORDER BY sie.sort_order ASC;
`;

/** 3. Sets for an exercise within a specific session instance. */
export const SQL_SETS_BY_SESSION_INSTANCE_AND_EXERCISE = `
SELECT s.*
FROM sets s
WHERE s.session_instance_id = ?
  AND s.exercise_id = ?
ORDER BY s.performed_at ASC, s.sort_order ASC;
`;

/** Open session instances (ended_at optional forever). */
export const SQL_OPEN_SESSION_INSTANCES = `
SELECT si.*
FROM session_instances si
WHERE si.ended_at IS NULL
ORDER BY si.started_at DESC;
`;
