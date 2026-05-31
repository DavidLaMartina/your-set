import { getDb } from '@/lib/db/client';
import { mapWorkoutRow } from '@/lib/db/map-row';
import * as WorkoutRepo from '@/lib/db/repositories/workout-repository';
import type { WorkoutRow } from '@/lib/db/row-types';
import type { Workout } from '@/types/domain';

export type SessionListItem = {
  workout: Workout;
  setCount: number;
  variantCount: number;
};

export async function listSessions(): Promise<SessionListItem[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<WorkoutRow>(
    `SELECT * FROM workouts
     ORDER BY CASE WHEN ended_at IS NULL THEN 0 ELSE 1 END, started_at DESC`,
  );

  const items: SessionListItem[] = [];
  for (const row of rows) {
    const workout = mapWorkoutRow(row);
    const setRow = await db.getFirstAsync<{ count: number }>(
      'SELECT COUNT(*) as count FROM sets WHERE workout_id = ?',
      workout.id,
    );
    const variantRow = await db.getFirstAsync<{ count: number }>(
      `SELECT COUNT(DISTINCT exercise_variant_id) as count FROM sets WHERE workout_id = ?`,
      workout.id,
    );
    items.push({
      workout,
      setCount: setRow?.count ?? 0,
      variantCount: variantRow?.count ?? 0,
    });
  }
  return items;
}

export async function startNewSession(name?: string | null): Promise<Workout> {
  return WorkoutRepo.createWorkout({
    name: name ?? null,
    startedAt: new Date().toISOString(),
  });
}
