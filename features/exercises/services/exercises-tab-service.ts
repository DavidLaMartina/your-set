import { getDb } from '@/lib/db/client';
import { mapExerciseRow } from '@/lib/db/map-row';
import type { ExerciseRow } from '@/lib/db/row-types';
import type { Exercise } from '@/types/domain';

export type ExerciseWithRecency = {
  exercise: Exercise;
  implementName: string | null;
  primaryMuscleName: string | null;
  lastPerformedAt: string | null;
  setCount: number;
};

export async function loadExercisesByRecency(): Promise<ExerciseWithRecency[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<
    ExerciseRow & {
      implement_name: string | null;
      muscle_name: string | null;
      last_performed: string | null;
      set_count: number;
    }
  >(
    `SELECT e.*,
            i.name AS implement_name,
            m.name AS muscle_name,
            MAX(s.performed_at) AS last_performed,
            COUNT(s.id) AS set_count
     FROM exercises e
     LEFT JOIN implements i ON i.id = e.implement_id
     LEFT JOIN muscles m ON m.id = e.primary_muscle_id
     LEFT JOIN sets s ON s.exercise_id = e.id
     GROUP BY e.id`,
  );

  const result: ExerciseWithRecency[] = rows.map((row) => ({
    exercise: mapExerciseRow(row),
    implementName: row.implement_name,
    primaryMuscleName: row.muscle_name,
    lastPerformedAt: row.last_performed,
    setCount: row.set_count ?? 0,
  }));

  result.sort((a, b) => {
    if (!a.lastPerformedAt && !b.lastPerformedAt) {
      return a.exercise.name.localeCompare(b.exercise.name);
    }
    if (!a.lastPerformedAt) return 1;
    if (!b.lastPerformedAt) return -1;
    return b.lastPerformedAt.localeCompare(a.lastPerformedAt);
  });

  return result;
}
