/**
 * Session definitions + instances. Renames workout model to:
 * - sessions (plan: order + default prescriptions via session_exercises)
 * - session_instances (one gym visit)
 * - session_instance_exercises (blocks logged in that visit)
 */
export const MIGRATION_002 = `
CREATE TABLE sessions (
  id TEXT PRIMARY KEY NOT NULL,
  name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'retired')),
  rotation_sort_order INTEGER,
  notes TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE session_exercises (
  id TEXT PRIMARY KEY NOT NULL,
  session_id TEXT NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  exercise_variant_id TEXT NOT NULL REFERENCES exercise_variants(id),
  sort_order INTEGER NOT NULL,
  target_sets INTEGER,
  target_reps_min INTEGER,
  target_reps_max INTEGER,
  target_weight REAL,
  prescription_notes TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE session_instances (
  id TEXT PRIMARY KEY NOT NULL,
  session_id TEXT REFERENCES sessions(id) ON DELETE SET NULL,
  started_at TEXT NOT NULL,
  ended_at TEXT,
  bodyweight REAL,
  notes TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE session_instance_exercises (
  id TEXT PRIMARY KEY NOT NULL,
  session_instance_id TEXT NOT NULL REFERENCES session_instances(id) ON DELETE CASCADE,
  exercise_variant_id TEXT NOT NULL REFERENCES exercise_variants(id),
  sort_order INTEGER NOT NULL,
  notes TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

INSERT INTO session_instances (
  id, session_id, started_at, ended_at, bodyweight, notes, created_at, updated_at
)
SELECT
  id,
  NULL,
  started_at,
  ended_at,
  bodyweight,
  CASE
    WHEN name IS NOT NULL AND TRIM(name) != '' THEN 'legacy_name:' || name
    ELSE notes
  END,
  created_at,
  updated_at
FROM workouts;

INSERT INTO session_instance_exercises (
  id, session_instance_id, exercise_variant_id, sort_order, notes, created_at, updated_at
)
SELECT id, workout_id, exercise_variant_id, sort_order, notes, created_at, updated_at
FROM workout_exercises;

ALTER TABLE sets ADD COLUMN session_instance_id TEXT REFERENCES session_instances(id) ON DELETE SET NULL;
ALTER TABLE sets ADD COLUMN session_instance_exercise_id TEXT REFERENCES session_instance_exercises(id) ON DELETE SET NULL;

UPDATE sets SET session_instance_id = workout_id WHERE workout_id IS NOT NULL;
UPDATE sets SET session_instance_exercise_id = workout_exercise_id WHERE workout_exercise_id IS NOT NULL;

DROP TABLE workout_exercises;
DROP TABLE workouts;

CREATE INDEX IF NOT EXISTS idx_sessions_status ON sessions(status, rotation_sort_order);
CREATE INDEX IF NOT EXISTS idx_session_exercises_session ON session_exercises(session_id, sort_order);
CREATE INDEX IF NOT EXISTS idx_session_instances_session ON session_instances(session_id, started_at DESC);
CREATE INDEX IF NOT EXISTS idx_session_instances_started ON session_instances(started_at DESC);
CREATE INDEX IF NOT EXISTS idx_instance_exercises_instance ON session_instance_exercises(session_instance_id);
CREATE INDEX IF NOT EXISTS idx_sets_session_instance ON sets(session_instance_id, performed_at DESC);
`;

export const SCHEMA_VERSION_002 = 2;
