/** Removes is_failure from sets (column left over from v1 / early v3). */
export const MIGRATION_004 = `
CREATE TABLE sets_v4 (
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

INSERT INTO sets_v4 (
  id, exercise_variant_id, performed_at,
  session_instance_id, session_instance_exercise_id,
  sort_order, weight, reps, rir, set_type, notes, created_at, updated_at
)
SELECT
  id, exercise_variant_id, performed_at,
  session_instance_id, session_instance_exercise_id,
  sort_order, weight, reps, rir, set_type, notes, created_at, updated_at
FROM sets;

DROP TABLE sets;

ALTER TABLE sets_v4 RENAME TO sets;

CREATE INDEX IF NOT EXISTS idx_sets_variant_performed ON sets(exercise_variant_id, performed_at DESC);
CREATE INDEX IF NOT EXISTS idx_sets_performed ON sets(performed_at DESC);
CREATE INDEX IF NOT EXISTS idx_sets_session_instance ON sets(session_instance_id, performed_at DESC);
`;

export const SCHEMA_VERSION_004 = 4;
