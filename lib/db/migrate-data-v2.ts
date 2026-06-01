import type * as SQLite from 'expo-sqlite';
import { newId } from '@/lib/db/id';
import { isoNow } from '@/lib/db/timestamps';

/**
 * After 002 SQL: link legacy instances that shared a workout.name to one session definition.
 */
export async function migrateDataToSessionDefinitions(db: SQLite.SQLiteDatabase): Promise<void> {
  const orphans = await db.getAllAsync<{ id: string; notes: string | null }>(
    `SELECT si.id, si.notes FROM session_instances si WHERE si.session_id IS NULL`,
  );
  if (orphans.length === 0) return;

  const nameGroups = new Map<string, string[]>();
  for (const row of orphans) {
    const match = row.notes?.match(/^legacy_name:(.+)$/);
    const legacyName = match?.[1];
    if (!legacyName) continue;
    const list = nameGroups.get(legacyName) ?? [];
    list.push(row.id);
    nameGroups.set(legacyName, list);
  }

  const now = isoNow();
  let sortOrder = 0;

  for (const [name, instanceIds] of nameGroups) {
    const sessionId = newId();
    await db.runAsync(
      `INSERT INTO sessions (id, name, status, rotation_sort_order, notes, created_at, updated_at)
       VALUES (?, ?, 'active', ?, NULL, ?, ?)`,
      sessionId,
      name,
      sortOrder++,
      now,
      now,
    );
    for (const instanceId of instanceIds) {
      await db.runAsync(
        `UPDATE session_instances SET session_id = ?, notes = NULL, updated_at = ? WHERE id = ?`,
        sessionId,
        now,
        instanceId,
      );
    }
  }
}
