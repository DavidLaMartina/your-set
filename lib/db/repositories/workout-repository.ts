import { getDb } from '@/lib/db/client';
import { newId } from '@/lib/db/id';
import { mapWorkoutRow } from '@/lib/db/map-row';
import { isoNow } from '@/lib/db/timestamps';
import type { WorkoutRow } from '@/lib/db/row-types';
import type { Workout } from '@/types/domain';

export type CreateWorkoutInput = {
  name?: string | null;
  startedAt: string;
  bodyweight?: number | null;
  notes?: string | null;
};

export async function getWorkoutById(id: string): Promise<Workout | null> {
  const db = await getDb();
  const row = await db.getFirstAsync<WorkoutRow>('SELECT * FROM workouts WHERE id = ?', id);
  return row ? mapWorkoutRow(row) : null;
}

export async function listOpenWorkouts(): Promise<Workout[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<WorkoutRow>(
    'SELECT * FROM workouts WHERE ended_at IS NULL ORDER BY started_at DESC',
  );
  return rows.map(mapWorkoutRow);
}

export async function createWorkout(input: CreateWorkoutInput): Promise<Workout> {
  const db = await getDb();
  const id = newId();
  const now = isoNow();
  await db.runAsync(
    `INSERT INTO workouts (id, name, started_at, ended_at, bodyweight, notes, created_at, updated_at)
     VALUES (?, ?, ?, NULL, ?, ?, ?, ?)`,
    id,
    input.name ?? null,
    input.startedAt,
    input.bodyweight ?? null,
    input.notes ?? null,
    now,
    now,
  );
  return (await getWorkoutById(id))!;
}

export async function endWorkout(id: string, endedAt: string = isoNow()): Promise<Workout | null> {
  const db = await getDb();
  const now = isoNow();
  await db.runAsync(
    'UPDATE workouts SET ended_at = ?, updated_at = ? WHERE id = ?',
    endedAt,
    now,
    id,
  );
  return getWorkoutById(id);
}
