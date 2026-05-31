import * as SQLite from 'expo-sqlite';

import { MIGRATION_001, SCHEMA_VERSION } from '@/lib/db/migrations/001-initial';

const DATABASE_NAME = 'your-set.db';

let database: SQLite.SQLiteDatabase | null = null;
let initPromise: Promise<SQLite.SQLiteDatabase> | null = null;

export async function initDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (database) return database;
  if (initPromise) return initPromise;

  initPromise = (async () => {
    const db = await SQLite.openDatabaseAsync(DATABASE_NAME);
    await db.execAsync('PRAGMA foreign_keys = ON;');

    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        version INTEGER PRIMARY KEY NOT NULL
      );
    `);

    const row = await db.getFirstAsync<{ version: number }>(
      'SELECT version FROM schema_migrations ORDER BY version DESC LIMIT 1',
    );

    if (!row) {
      await db.execAsync(MIGRATION_001);
      await db.runAsync('INSERT INTO schema_migrations (version) VALUES (?)', SCHEMA_VERSION);
    }

    database = db;
    return db;
  })();

  return initPromise;
}

export async function getDb(): Promise<SQLite.SQLiteDatabase> {
  if (database) return database;
  return initDatabase();
}

export async function resetDatabaseForDev(): Promise<void> {
  if (database) {
    await database.closeAsync();
    database = null;
  }
  initPromise = null;
  await SQLite.deleteDatabaseAsync(DATABASE_NAME);
  await initDatabase();
}
