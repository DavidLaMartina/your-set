import type * as SQLite from 'expo-sqlite';

/**
 * Schema v8: remove `rep_segments` if a dev build briefly added it.
 * v1 is weight × reps only — no cluster / multi-bout storage.
 */
export const SCHEMA_VERSION_008 = 8;

export async function applyMigration008(db: SQLite.SQLiteDatabase): Promise<void> {
  const columns = await db.getAllAsync<{ name: string }>('PRAGMA table_info(sets)');
  if (!columns.some((c) => c.name === 'rep_segments')) return;
  await db.execAsync('ALTER TABLE sets DROP COLUMN rep_segments;');
}
