import type * as SQLite from 'expo-sqlite';

/**
 * Schema v9: manufacturer defaults on session plan + workout blocks;
 * editing_unlocked on ended workouts.
 */
export const SCHEMA_VERSION_009 = 9;

export async function applyMigration009(db: SQLite.SQLiteDatabase): Promise<void> {
  const sessionExerciseCols = await db.getAllAsync<{ name: string }>(
    'PRAGMA table_info(session_exercises)',
  );
  if (!sessionExerciseCols.some((c) => c.name === 'manufacturer_id')) {
    await db.execAsync(`
      ALTER TABLE session_exercises
        ADD COLUMN manufacturer_id TEXT REFERENCES manufacturers(id) ON DELETE SET NULL;
    `);
  }

  const blockCols = await db.getAllAsync<{ name: string }>(
    'PRAGMA table_info(session_instance_exercises)',
  );
  if (!blockCols.some((c) => c.name === 'manufacturer_id')) {
    await db.execAsync(`
      ALTER TABLE session_instance_exercises
        ADD COLUMN manufacturer_id TEXT REFERENCES manufacturers(id) ON DELETE SET NULL;
    `);
  }

  const instanceCols = await db.getAllAsync<{ name: string }>(
    'PRAGMA table_info(session_instances)',
  );
  if (!instanceCols.some((c) => c.name === 'editing_unlocked')) {
    await db.execAsync(`
      ALTER TABLE session_instances
        ADD COLUMN editing_unlocked INTEGER NOT NULL DEFAULT 0;
    `);
  }

  await db.execAsync(`
    CREATE INDEX IF NOT EXISTS idx_session_exercises_manufacturer
      ON session_exercises(manufacturer_id);
    CREATE INDEX IF NOT EXISTS idx_instance_exercises_manufacturer
      ON session_instance_exercises(manufacturer_id);
    INSERT OR IGNORE INTO manufacturers (id, name) VALUES ('mfr-prime', 'Prime');
  `);
}
