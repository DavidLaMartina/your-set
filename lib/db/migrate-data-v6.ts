import type * as SQLite from 'expo-sqlite';

async function tableExists(db: SQLite.SQLiteDatabase, name: string): Promise<boolean> {
  const row = await db.getFirstAsync<{ name: string }>(
    `SELECT name FROM sqlite_master WHERE type = 'table' AND name = ?`,
    name,
  );
  return row != null;
}

async function tableHasColumn(
  db: SQLite.SQLiteDatabase,
  table: string,
  column: string,
): Promise<boolean> {
  const rows = await db.getAllAsync<{ name: string }>(`PRAGMA table_info(${table})`);
  return rows.some((r) => r.name === column);
}

async function tableRowCount(db: SQLite.SQLiteDatabase, table: string): Promise<number> {
  const row = await db.getFirstAsync<{ count: number }>(`SELECT COUNT(*) AS count FROM ${table}`);
  return row?.count ?? 0;
}

async function tableSqlReferencesStaleParent(
  db: SQLite.SQLiteDatabase,
  table: string,
): Promise<boolean> {
  const row = await db.getFirstAsync<{ sql: string | null }>(
    `SELECT sql FROM sqlite_master WHERE type = 'table' AND name = ?`,
    table,
  );
  const sql = row?.sql ?? '';
  return sql.includes('exercises_old') || sql.includes('sets_old');
}

/**
 * Renaming a parent table (e.g. exercises → exercises_old) rewrites child FK metadata
 * to exercises_old. Dropping exercises_old then breaks INSERT/UPDATE on those children.
 * Rebuild any affected tables so FKs point at exercises / sets again.
 */
export async function repairMigration006StaleParentReferences(
  db: SQLite.SQLiteDatabase,
): Promise<void> {
  const staleTables = [
    'exercise_secondary_muscles',
    'session_exercises',
    'session_instance_exercises',
    'sets',
    'set_videos',
  ] as const;

  const needsRepair = (
    await Promise.all(staleTables.map((t) => tableSqlReferencesStaleParent(db, t)))
  ).some(Boolean);

  if (!needsRepair) return;

  await db.execAsync('PRAGMA foreign_keys = OFF');
  try {
    if (await tableSqlReferencesStaleParent(db, 'exercise_secondary_muscles')) {
      await repairExerciseSecondaryMuscles(db);
    }
    if (await tableSqlReferencesStaleParent(db, 'session_exercises')) {
      await repairSessionExercises(db);
    }
    if (await tableSqlReferencesStaleParent(db, 'session_instance_exercises')) {
      await repairSessionInstanceExercises(db);
    }
    if (await tableSqlReferencesStaleParent(db, 'sets')) {
      await repairSets(db);
    }
    if ((await tableExists(db, 'set_videos')) && (await tableSqlReferencesStaleParent(db, 'set_videos'))) {
      await repairSetVideos(db);
    }

    await db.execAsync('DROP TABLE IF EXISTS exercises_old');
    await db.execAsync('DROP TABLE IF EXISTS sets_old');
  } finally {
    await db.execAsync('PRAGMA foreign_keys = ON');
  }
}

/**
 * Move manufacturer from exercise → set. Idempotent: safe after partial runs
 * (SQLite commits each DDL statement separately, so a failed exec can leave
 * temp tables like exercises_v6 behind while schema_migrations stays at 5).
 *
 * Never rename a parent table to *_old — SQLite rewrites child FKs to that name.
 * Use DROP parent + RENAME temp instead (with foreign_keys OFF).
 */
export async function applyMigration006(db: SQLite.SQLiteDatabase): Promise<void> {
  await db.execAsync('PRAGMA foreign_keys = OFF');
  try {
    await recoverInterruptedTableSwap(db, 'sets');
    await recoverInterruptedTableSwap(db, 'exercises');

    const setsNeedManufacturer =
      (await tableExists(db, 'sets')) && !(await tableHasColumn(db, 'sets', 'manufacturer_id'));
    const exercisesNeedStrip =
      (await tableExists(db, 'exercises')) &&
      (await tableHasColumn(db, 'exercises', 'manufacturer_id'));

    if (setsNeedManufacturer) {
      await rebuildSetsWithManufacturer(db);
    } else {
      await db.execAsync('DROP TABLE IF EXISTS sets_v6');
      await db.execAsync('DROP TABLE IF EXISTS sets_old');
    }

    if (exercisesNeedStrip) {
      await rebuildExercisesWithoutManufacturer(db);
    } else {
      await db.execAsync('DROP TABLE IF EXISTS exercises_v6');
      await db.execAsync('DROP TABLE IF EXISTS exercises_old');
    }

    await db.execAsync(`
      CREATE INDEX IF NOT EXISTS idx_exercises_implement ON exercises(implement_id);
      CREATE INDEX IF NOT EXISTS idx_exercises_primary_muscle ON exercises(primary_muscle_id);
      CREATE INDEX IF NOT EXISTS idx_sets_exercise_performed ON sets(exercise_id, performed_at DESC);
      CREATE INDEX IF NOT EXISTS idx_sets_performed ON sets(performed_at DESC);
      CREATE INDEX IF NOT EXISTS idx_sets_session_instance ON sets(session_instance_id, performed_at DESC);
      CREATE INDEX IF NOT EXISTS idx_sets_manufacturer ON sets(manufacturer_id);
    `);
  } finally {
    await db.execAsync('PRAGMA foreign_keys = ON');
  }
}

/** Finish a swap that stopped mid-way. Uses DROP + RENAME, not parent rename. */
async function recoverInterruptedTableSwap(
  db: SQLite.SQLiteDatabase,
  baseName: string,
): Promise<void> {
  const live = baseName;
  const temp = `${baseName}_v6`;
  const legacy = `${baseName}_old`;

  if (!(await tableExists(db, live)) && (await tableExists(db, temp))) {
    await db.execAsync(`ALTER TABLE ${temp} RENAME TO ${live}`);
  }

  if ((await tableExists(db, live)) && (await tableExists(db, temp))) {
    const tempRows = await tableRowCount(db, temp);
    if (tempRows > 0) {
      await db.execAsync(`DROP TABLE ${live}`);
      await db.execAsync(`ALTER TABLE ${temp} RENAME TO ${live}`);
    } else {
      await db.execAsync(`DROP TABLE ${temp}`);
    }
  }

  await db.execAsync(`DROP TABLE IF EXISTS ${legacy}`);
}

async function rebuildSetsWithManufacturer(db: SQLite.SQLiteDatabase): Promise<void> {
  await db.execAsync('DROP TABLE IF EXISTS sets_v6');
  await db.execAsync(`
    CREATE TABLE sets_v6 (
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
      manufacturer_id TEXT REFERENCES manufacturers(id) ON DELETE SET NULL,
      notes TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      CHECK (session_instance_exercise_id IS NULL OR session_instance_id IS NOT NULL)
    );
  `);

  await db.execAsync(`
    INSERT INTO sets_v6 (
      id, exercise_id, performed_at,
      session_instance_id, session_instance_exercise_id,
      sort_order, weight, reps, rir, set_type, manufacturer_id, notes, created_at, updated_at
    )
    SELECT
      id, exercise_id, performed_at,
      session_instance_id, session_instance_exercise_id,
      sort_order, weight, reps, rir, set_type, NULL, notes, created_at, updated_at
    FROM sets;
  `);

  await db.execAsync('DROP TABLE sets');
  await db.execAsync('ALTER TABLE sets_v6 RENAME TO sets');
}

async function rebuildExercisesWithoutManufacturer(db: SQLite.SQLiteDatabase): Promise<void> {
  await db.execAsync('DROP TABLE IF EXISTS exercises_v6');
  await db.execAsync(`
    CREATE TABLE exercises_v6 (
      id TEXT PRIMARY KEY NOT NULL,
      name TEXT NOT NULL,
      implement_id TEXT REFERENCES implements(id) ON DELETE SET NULL,
      primary_muscle_id TEXT REFERENCES muscles(id) ON DELETE SET NULL,
      origin TEXT NOT NULL DEFAULT 'custom' CHECK (origin IN ('stock', 'custom')),
      catalog_id TEXT,
      notes TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `);
  await db.execAsync(`
    INSERT INTO exercises_v6 (
      id, name, implement_id, primary_muscle_id, origin, catalog_id, notes, created_at, updated_at
    )
    SELECT
      id, name, implement_id, primary_muscle_id, origin, catalog_id, notes, created_at, updated_at
    FROM exercises;
  `);

  await db.execAsync('DROP TABLE exercises');
  await db.execAsync('ALTER TABLE exercises_v6 RENAME TO exercises');
}

async function repairExerciseSecondaryMuscles(db: SQLite.SQLiteDatabase): Promise<void> {
  await db.execAsync('DROP TABLE IF EXISTS exercise_secondary_muscles_fix');
  await db.execAsync(`
    CREATE TABLE exercise_secondary_muscles_fix (
      exercise_id TEXT NOT NULL REFERENCES exercises(id) ON DELETE CASCADE,
      muscle_id TEXT NOT NULL REFERENCES muscles(id) ON DELETE CASCADE,
      PRIMARY KEY (exercise_id, muscle_id)
    );
  `);
  await db.execAsync(`
    INSERT INTO exercise_secondary_muscles_fix (exercise_id, muscle_id)
    SELECT exercise_id, muscle_id FROM exercise_secondary_muscles;
  `);
  await db.execAsync('DROP TABLE exercise_secondary_muscles');
  await db.execAsync('ALTER TABLE exercise_secondary_muscles_fix RENAME TO exercise_secondary_muscles');
}

async function repairSessionExercises(db: SQLite.SQLiteDatabase): Promise<void> {
  await db.execAsync('DROP TABLE IF EXISTS session_exercises_fix');
  await db.execAsync(`
    CREATE TABLE session_exercises_fix (
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
  `);
  await db.execAsync(`
    INSERT INTO session_exercises_fix (
      id, session_id, exercise_id, sort_order,
      target_sets, target_reps_min, target_reps_max, target_weight,
      prescription_notes, created_at, updated_at
    )
    SELECT
      id, session_id, exercise_id, sort_order,
      target_sets, target_reps_min, target_reps_max, target_weight,
      prescription_notes, created_at, updated_at
    FROM session_exercises;
  `);
  await db.execAsync('DROP TABLE session_exercises');
  await db.execAsync('ALTER TABLE session_exercises_fix RENAME TO session_exercises');
}

async function repairSessionInstanceExercises(db: SQLite.SQLiteDatabase): Promise<void> {
  await db.execAsync('DROP TABLE IF EXISTS session_instance_exercises_fix');
  await db.execAsync(`
    CREATE TABLE session_instance_exercises_fix (
      id TEXT PRIMARY KEY NOT NULL,
      session_instance_id TEXT NOT NULL REFERENCES session_instances(id) ON DELETE CASCADE,
      exercise_id TEXT NOT NULL REFERENCES exercises(id),
      sort_order INTEGER NOT NULL,
      notes TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `);
  await db.execAsync(`
    INSERT INTO session_instance_exercises_fix (
      id, session_instance_id, exercise_id, sort_order, notes, created_at, updated_at
    )
    SELECT id, session_instance_id, exercise_id, sort_order, notes, created_at, updated_at
    FROM session_instance_exercises;
  `);
  await db.execAsync('DROP TABLE session_instance_exercises');
  await db.execAsync(
    'ALTER TABLE session_instance_exercises_fix RENAME TO session_instance_exercises',
  );
}

async function repairSets(db: SQLite.SQLiteDatabase): Promise<void> {
  const hasManufacturer = await tableHasColumn(db, 'sets', 'manufacturer_id');

  await db.execAsync('DROP TABLE IF EXISTS sets_fix');
  await db.execAsync(`
    CREATE TABLE sets_fix (
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
      manufacturer_id TEXT REFERENCES manufacturers(id) ON DELETE SET NULL,
      notes TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      CHECK (session_instance_exercise_id IS NULL OR session_instance_id IS NOT NULL)
    );
  `);

  if (hasManufacturer) {
    await db.execAsync(`
      INSERT INTO sets_fix (
        id, exercise_id, performed_at,
        session_instance_id, session_instance_exercise_id,
        sort_order, weight, reps, rir, set_type, manufacturer_id, notes, created_at, updated_at
      )
      SELECT
        id, exercise_id, performed_at,
        session_instance_id, session_instance_exercise_id,
        sort_order, weight, reps, rir, set_type, manufacturer_id, notes, created_at, updated_at
      FROM sets;
    `);
  } else {
    await db.execAsync(`
      INSERT INTO sets_fix (
        id, exercise_id, performed_at,
        session_instance_id, session_instance_exercise_id,
        sort_order, weight, reps, rir, set_type, manufacturer_id, notes, created_at, updated_at
      )
      SELECT
        id, exercise_id, performed_at,
        session_instance_id, session_instance_exercise_id,
        sort_order, weight, reps, rir, set_type, NULL, notes, created_at, updated_at
      FROM sets;
    `);
  }

  await db.execAsync('DROP TABLE sets');
  await db.execAsync('ALTER TABLE sets_fix RENAME TO sets');
}

async function repairSetVideos(db: SQLite.SQLiteDatabase): Promise<void> {
  await db.execAsync('DROP TABLE IF EXISTS set_videos_fix');
  await db.execAsync(`
    CREATE TABLE set_videos_fix (
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
  `);
  await db.execAsync(`
    INSERT INTO set_videos_fix (
      id, set_id, asset_id, uri, thumbnail_uri, duration_ms, width, height,
      camera_angle, notes, availability_status, created_at, updated_at
    )
    SELECT
      id, set_id, asset_id, uri, thumbnail_uri, duration_ms, width, height,
      camera_angle, notes, availability_status, created_at, updated_at
    FROM set_videos;
  `);
  await db.execAsync('DROP TABLE set_videos');
  await db.execAsync('ALTER TABLE set_videos_fix RENAME TO set_videos');
}
