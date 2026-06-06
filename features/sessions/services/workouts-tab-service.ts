import { getDb } from '@/lib/db/client';
import { mapSessionInstanceRow } from '@/lib/db/map-row';
import * as SessionRepo from '@/lib/db/repositories/session-repository';
import * as SessionExerciseRepo from '@/lib/db/repositories/session-exercise-repository';
import * as SessionInstanceRepo from '@/lib/db/repositories/session-instance-repository';
import * as SessionInstanceExerciseRepo from '@/lib/db/repositories/session-instance-exercise-repository';
import type { SessionInstanceRow } from '@/lib/db/row-types';
import type { Session, SessionInstance } from '@/types/domain';

export type WorkoutListItem = {
  instance: SessionInstance;
  sessionName: string | null;
  setCount: number;
  exerciseCount: number;
};

export type WorkoutsTabData = {
  /** Active session definitions — quick start only. */
  rotation: Session[];
  openWorkouts: WorkoutListItem[];
  recentWorkouts: WorkoutListItem[];
};

export async function loadWorkoutsTab(): Promise<WorkoutsTabData> {
  const [rotation, allItems] = await Promise.all([
    SessionRepo.listSessionsByStatus('active'),
    listAllWorkoutItems(),
  ]);

  const openWorkouts = allItems.filter((item) => item.instance.endedAt == null);
  const recentWorkouts = allItems.filter((item) => item.instance.endedAt != null);

  return { rotation, openWorkouts, recentWorkouts };
}

async function listAllWorkoutItems(): Promise<WorkoutListItem[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<SessionInstanceRow & { session_name: string | null }>(
    `SELECT si.*, s.name as session_name
     FROM session_instances si
     LEFT JOIN sessions s ON s.id = si.session_id
     ORDER BY si.started_at DESC
     LIMIT 50`,
  );

  return Promise.all(
    rows.map(async (row) => {
      const instance = mapSessionInstanceRow(row);
      const setCountRow = await db.getFirstAsync<{ count: number }>(
        `SELECT COUNT(*) as count FROM sets
         WHERE session_instance_id = ?`,
        instance.id,
      );
      const exerciseCountRow = await db.getFirstAsync<{ count: number }>(
        `SELECT COUNT(DISTINCT exercise_id) as count FROM sets
         WHERE session_instance_id = ?`,
        instance.id,
      );
      return {
        instance,
        sessionName: row.session_name,
        setCount: setCountRow?.count ?? 0,
        exerciseCount: exerciseCountRow?.count ?? 0,
      };
    }),
  );
}

export async function deleteWorkout(instanceId: string): Promise<void> {
  await SessionInstanceRepo.deleteSessionInstance(instanceId);
}

export async function getWorkoutDeleteSummary(instanceId: string): Promise<{
  sessionName: string | null;
  setCount: number;
} | null> {
  const instance = await SessionInstanceRepo.getSessionInstanceById(instanceId);
  if (!instance) return null;

  let sessionName: string | null = null;
  if (instance.sessionId) {
    const session = await SessionRepo.getSessionById(instance.sessionId);
    sessionName = session?.name ?? null;
  }

  const db = await getDb();
  const setCountRow = await db.getFirstAsync<{ count: number }>(
    `SELECT COUNT(*) as count FROM sets
     WHERE session_instance_id = ?`,
    instanceId,
  );

  return {
    sessionName,
    setCount: setCountRow?.count ?? 0,
  };
}

export async function startSessionFromDefinition(sessionId: string): Promise<SessionInstance> {
  const instance = await SessionInstanceRepo.createSessionInstance({ sessionId });
  const planned = await SessionExerciseRepo.listSessionExercises(sessionId);
  for (const exercise of planned) {
    await SessionInstanceExerciseRepo.createSessionInstanceExercise({
      sessionInstanceId: instance.id,
      exerciseId: exercise.exerciseId,
      sortOrder: exercise.sortOrder,
      notes: exercise.prescriptionNotes,
    });
  }
  return instance;
}

export async function startAdHocWorkout(): Promise<SessionInstance> {
  return SessionInstanceRepo.createSessionInstance();
}
