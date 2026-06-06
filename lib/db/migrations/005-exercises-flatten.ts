/**
 * Collapse exercise/variant into a single `exercises` table.
 *
 * - `exercise_variants` is removed; the EXERCISE is now the loggable unit.
 * - Free-text `muscle_group` / `equipment` become foreign keys to seeded
 *   reference tables (`muscles`, `implements`), plus optional `manufacturers`.
 * - Secondary muscles live in a join table (`exercise_secondary_muscles`).
 * - `origin` / `catalog_id` are the seam for a future shared/cloud library.
 *
 * Existing rows are disposable (pre-release), so this drops the variant-bound
 * tables and recreates them keyed on `exercise_id`. Demo data is reseeded by
 * `seedDatabaseIfEmpty`; reference rows are seeded here as stock data.
 */
export const MIGRATION_005 = `
PRAGMA foreign_keys = OFF;

-- Drop variant-bound tables (children first). Data is disposable pre-release.
DROP TABLE IF EXISTS set_videos;
DROP TABLE IF EXISTS sets;
DROP TABLE IF EXISTS session_instance_exercises;
DROP TABLE IF EXISTS session_exercises;
DROP TABLE IF EXISTS session_instances;
DROP TABLE IF EXISTS sessions;
DROP TABLE IF EXISTS exercise_variants;
DROP TABLE IF EXISTS exercises;

-- Reference (stock) lookups
CREATE TABLE implements (
  id TEXT PRIMARY KEY NOT NULL,
  name TEXT NOT NULL UNIQUE,
  sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE muscles (
  id TEXT PRIMARY KEY NOT NULL,
  name TEXT NOT NULL UNIQUE,
  region TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE manufacturers (
  id TEXT PRIMARY KEY NOT NULL,
  name TEXT NOT NULL UNIQUE
);

INSERT INTO implements (id, name, sort_order) VALUES
  ('imp-barbell', 'Barbell', 1),
  ('imp-dumbbell', 'Dumbbell', 2),
  ('imp-machine', 'Machine', 3),
  ('imp-cable', 'Cable', 4),
  ('imp-smith', 'Smith machine', 5),
  ('imp-bodyweight', 'Bodyweight', 6),
  ('imp-kettlebell', 'Kettlebell', 7),
  ('imp-band', 'Band', 8),
  ('imp-other', 'Other', 99);

INSERT INTO muscles (id, name, region, sort_order) VALUES
  ('mus-chest', 'Chest', 'Chest', 1),
  ('mus-upper-chest', 'Upper chest', 'Chest', 2),
  ('mus-lats', 'Lats', 'Back', 10),
  ('mus-upper-back', 'Upper back', 'Back', 11),
  ('mus-traps', 'Traps', 'Back', 12),
  ('mus-lower-back', 'Lower back', 'Back', 13),
  ('mus-front-delts', 'Front delts', 'Shoulders', 20),
  ('mus-side-delts', 'Side delts', 'Shoulders', 21),
  ('mus-rear-delts', 'Rear delts', 'Shoulders', 22),
  ('mus-biceps', 'Biceps', 'Arms', 30),
  ('mus-triceps', 'Triceps', 'Arms', 31),
  ('mus-forearms', 'Forearms', 'Arms', 32),
  ('mus-quads', 'Quads', 'Legs', 40),
  ('mus-hamstrings', 'Hamstrings', 'Legs', 41),
  ('mus-glutes', 'Glutes', 'Legs', 42),
  ('mus-calves', 'Calves', 'Legs', 43),
  ('mus-adductors', 'Adductors', 'Legs', 44),
  ('mus-abs', 'Abs', 'Core', 50),
  ('mus-obliques', 'Obliques', 'Core', 51);

INSERT INTO manufacturers (id, name) VALUES
  ('mfr-hammer-strength', 'Hammer Strength'),
  ('mfr-nautilus', 'Nautilus'),
  ('mfr-cybex', 'Cybex'),
  ('mfr-life-fitness', 'Life Fitness'),
  ('mfr-hoist', 'Hoist');

-- Exercise = single loggable unit
CREATE TABLE exercises (
  id TEXT PRIMARY KEY NOT NULL,
  name TEXT NOT NULL,
  implement_id TEXT REFERENCES implements(id) ON DELETE SET NULL,
  primary_muscle_id TEXT REFERENCES muscles(id) ON DELETE SET NULL,
  manufacturer_id TEXT REFERENCES manufacturers(id) ON DELETE SET NULL,
  origin TEXT NOT NULL DEFAULT 'custom' CHECK (origin IN ('stock', 'custom')),
  catalog_id TEXT,
  notes TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE exercise_secondary_muscles (
  exercise_id TEXT NOT NULL REFERENCES exercises(id) ON DELETE CASCADE,
  muscle_id TEXT NOT NULL REFERENCES muscles(id) ON DELETE CASCADE,
  PRIMARY KEY (exercise_id, muscle_id)
);

-- Sessions / instances rebuilt keyed on exercise_id
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
  exercise_id TEXT NOT NULL REFERENCES exercises(id),
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
  exercise_id TEXT NOT NULL REFERENCES exercises(id),
  sort_order INTEGER NOT NULL,
  notes TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE sets (
  id TEXT PRIMARY KEY NOT NULL,
  exercise_id TEXT NOT NULL REFERENCES exercises(id),
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

CREATE INDEX IF NOT EXISTS idx_exercises_implement ON exercises(implement_id);
CREATE INDEX IF NOT EXISTS idx_exercises_primary_muscle ON exercises(primary_muscle_id);
CREATE INDEX IF NOT EXISTS idx_exercise_secondary_muscles_ex ON exercise_secondary_muscles(exercise_id);
CREATE INDEX IF NOT EXISTS idx_sessions_status ON sessions(status, rotation_sort_order);
CREATE INDEX IF NOT EXISTS idx_session_exercises_session ON session_exercises(session_id, sort_order);
CREATE INDEX IF NOT EXISTS idx_session_instances_session ON session_instances(session_id, started_at DESC);
CREATE INDEX IF NOT EXISTS idx_session_instances_started ON session_instances(started_at DESC);
CREATE INDEX IF NOT EXISTS idx_instance_exercises_instance ON session_instance_exercises(session_instance_id);
CREATE INDEX IF NOT EXISTS idx_sets_exercise_performed ON sets(exercise_id, performed_at DESC);
CREATE INDEX IF NOT EXISTS idx_sets_performed ON sets(performed_at DESC);
CREATE INDEX IF NOT EXISTS idx_sets_session_instance ON sets(session_instance_id, performed_at DESC);

PRAGMA foreign_keys = ON;
`;

export const SCHEMA_VERSION_005 = 5;
