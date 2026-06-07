import * as SQLite from 'expo-sqlite';

import { MIGRATION_001, SCHEMA_VERSION as SCHEMA_V1 } from '@/lib/db/migrations/001-initial';
import { MIGRATION_002, SCHEMA_VERSION_002 } from '@/lib/db/migrations/002-sessions';
import { MIGRATION_003, SCHEMA_VERSION_003 } from '@/lib/db/migrations/003-sets-drop-legacy-workout-fks';
import { MIGRATION_004, SCHEMA_VERSION_004 } from '@/lib/db/migrations/004-drop-set-failure-flag';
import { MIGRATION_005, SCHEMA_VERSION_005 } from '@/lib/db/migrations/005-exercises-flatten';
import { SCHEMA_VERSION_006 } from '@/lib/db/migrations/006-set-manufacturer';
import { migrateDataToSessionDefinitions } from '@/lib/db/migrate-data-v2';
import {
  applyMigration006,
  repairMigration006StaleParentReferences,
} from '@/lib/db/migrate-data-v6';

const DATABASE_NAME = 'your-set.db';

export const SCHEMA_VERSION = SCHEMA_VERSION_006;

let database: SQLite.SQLiteDatabase | null = null;
let initPromise: Promise<SQLite.SQLiteDatabase> | null = null;

async function getSchemaVersion(db: SQLite.SQLiteDatabase): Promise<number> {
  const row = await db.getFirstAsync<{ version: number }>(
    'SELECT version FROM schema_migrations ORDER BY version DESC LIMIT 1',
  );
  return row?.version ?? 0;
}

async function applyMigrations(db: SQLite.SQLiteDatabase): Promise<void> {
  let version = await getSchemaVersion(db);

  if (version < SCHEMA_V1) {
    await db.execAsync(MIGRATION_001);
    await db.runAsync('INSERT INTO schema_migrations (version) VALUES (?)', SCHEMA_V1);
    version = SCHEMA_V1;
  }

  if (version < SCHEMA_VERSION_002) {
    await db.execAsync(MIGRATION_002);
    await migrateDataToSessionDefinitions(db);
    await db.runAsync('INSERT INTO schema_migrations (version) VALUES (?)', SCHEMA_VERSION_002);
    version = SCHEMA_VERSION_002;
  }

  if (version < SCHEMA_VERSION_003) {
    await db.execAsync(MIGRATION_003);
    await db.runAsync('INSERT INTO schema_migrations (version) VALUES (?)', SCHEMA_VERSION_003);
    version = SCHEMA_VERSION_003;
  }

  if (version < SCHEMA_VERSION_004) {
    await db.execAsync(MIGRATION_004);
    await db.runAsync('INSERT INTO schema_migrations (version) VALUES (?)', SCHEMA_VERSION_004);
    version = SCHEMA_VERSION_004;
  }

  if (version < SCHEMA_VERSION_005) {
    await db.execAsync(MIGRATION_005);
    await db.runAsync('INSERT INTO schema_migrations (version) VALUES (?)', SCHEMA_VERSION_005);
    version = SCHEMA_VERSION_005;
  }

  if (version < SCHEMA_VERSION_006) {
    await applyMigration006(db);
    await db.runAsync('INSERT INTO schema_migrations (version) VALUES (?)', SCHEMA_VERSION_006);
  }
}

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

    await applyMigrations(db);
    await repairMigration006StaleParentReferences(db);

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
