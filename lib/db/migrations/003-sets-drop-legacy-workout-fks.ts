/**
 * Migration 002 dropped workouts / workout_exercises but left sets.workout_* columns
 * with FK references to those tables — inserts fail with "no such table: workout_exercises".
 * Rebuild sets using only session_instance_* links.
 */
export const MIGRATION_003 = `
CREATE TABLE sets_new (
  id TEXT PRIMARY KEY NOT NULL,
  exercise_variant_id TEXT NOT NULL REFERENCES exercise_variants(id),
  performed_at TEXT NOT NULL,
  session_instance_id TEXT REFERENCES session_instances(id) ON DELETE SET NULL,
  session_instance_exercise_id TEXT REFERENCES session_instance_exercises(id) ON DELETE SET NULL,
  sort_order INTEGER,
  weight REAL,
  reps INTEGER,
  rir INTEGER,
  set_type TEXT NOT NULL DEFAULT 'straight',
  notes TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  CHECK (session_instance_exercise_id IS NULL OR session_instance_id IS NOT NULL)
);

INSERT INTO sets_new (
  id, exercise_variant_id, performed_at,
  session_instance_id, session_instance_exercise_id,
  sort_order, weight, reps, rir, set_type, notes, created_at, updated_at
)
SELECT
  id,
  exercise_variant_id,
  performed_at,
  COALESCE(session_instance_id, workout_id),
  COALESCE(session_instance_exercise_id, workout_exercise_id),
  sort_order,
  weight,
  reps,
  rir,
  set_type,
  notes,
  created_at,
  updated_at
FROM sets;

DROP TABLE sets;

ALTER TABLE sets_new RENAME TO sets;

CREATE INDEX IF NOT EXISTS idx_sets_variant_performed ON sets(exercise_variant_id, performed_at DESC);
CREATE INDEX IF NOT EXISTS idx_sets_performed ON sets(performed_at DESC);
CREATE INDEX IF NOT EXISTS idx_sets_session_instance ON sets(session_instance_id, performed_at DESC);
`;

export const SCHEMA_VERSION_003 = 3;
