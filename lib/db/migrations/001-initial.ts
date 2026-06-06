/** Runtime migration — keep in sync with 001_initial.sql */
export const MIGRATION_001 = `
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS schema_migrations (
  version INTEGER PRIMARY KEY NOT NULL
);

CREATE TABLE exercises (
  id TEXT PRIMARY KEY NOT NULL,
  name TEXT NOT NULL,
  default_muscle_group TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE exercise_variants (
  id TEXT PRIMARY KEY NOT NULL,
  exercise_id TEXT NOT NULL REFERENCES exercises(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  muscle_group TEXT,
  equipment TEXT,
  setup_notes TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE workouts (
  id TEXT PRIMARY KEY NOT NULL,
  name TEXT,
  started_at TEXT NOT NULL,
  ended_at TEXT,
  bodyweight REAL,
  notes TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE workout_exercises (
  id TEXT PRIMARY KEY NOT NULL,
  workout_id TEXT NOT NULL REFERENCES workouts(id) ON DELETE CASCADE,
  exercise_variant_id TEXT NOT NULL REFERENCES exercise_variants(id),
  sort_order INTEGER NOT NULL,
  notes TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE sets (
  id TEXT PRIMARY KEY NOT NULL,
  exercise_variant_id TEXT NOT NULL REFERENCES exercise_variants(id),
  performed_at TEXT NOT NULL,
  workout_id TEXT REFERENCES workouts(id) ON DELETE SET NULL,
  workout_exercise_id TEXT REFERENCES workout_exercises(id) ON DELETE SET NULL,
  sort_order INTEGER,
  weight REAL,
  reps INTEGER,
  rir INTEGER,
  set_type TEXT NOT NULL DEFAULT 'straight',
  notes TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  CHECK (workout_exercise_id IS NULL OR workout_id IS NOT NULL)
);

CREATE TABLE set_videos (
  id TEXT PRIMARY KEY NOT NULL,
  set_id TEXT NOT NULL UNIQUE REFERENCES sets(id) ON DELETE CASCADE,
  asset_id TEXT,
  uri TEXT,
  thumbnail_uri TEXT,
  duration_ms INTEGER,
  width INTEGER,
  height INTEGER,
  camera_angle TEXT,
  notes TEXT,
  availability_status TEXT NOT NULL DEFAULT 'unknown',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_variants_exercise ON exercise_variants(exercise_id);
CREATE INDEX IF NOT EXISTS idx_workouts_started ON workouts(started_at DESC);
CREATE INDEX IF NOT EXISTS idx_workout_exercises_workout ON workout_exercises(workout_id);
CREATE INDEX IF NOT EXISTS idx_sets_workout ON sets(workout_id, performed_at DESC);
CREATE INDEX IF NOT EXISTS idx_sets_variant_performed ON sets(exercise_variant_id, performed_at DESC);
CREATE INDEX IF NOT EXISTS idx_sets_performed ON sets(performed_at DESC);
`;

export const SCHEMA_VERSION = 1;
