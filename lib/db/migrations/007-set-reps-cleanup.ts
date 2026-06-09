/**
 * Schema v7: simplify the set model for v1.
 *
 * - Drop `rir` (track in notes/tags later).
 * - Drop `set_type` (not used in v1).
 *
 * v1 logging is weight × reps only. No column we drop is referenced by an
 * index, so plain ALTER TABLE DROP COLUMN is safe (SQLite 3.35+).
 */
export const SCHEMA_VERSION_007 = 7;

export const MIGRATION_007 = `
  ALTER TABLE sets DROP COLUMN rir;
  ALTER TABLE sets DROP COLUMN set_type;
`;
