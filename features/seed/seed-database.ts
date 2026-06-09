import * as ExerciseRepo from '@/lib/db/repositories/exercise-repository';
import * as SetRepo from '@/lib/db/repositories/set-repository';
import * as SessionRepo from '@/lib/db/repositories/session-repository';
import * as SessionExerciseRepo from '@/lib/db/repositories/session-exercise-repository';
import * as SessionInstanceRepo from '@/lib/db/repositories/session-instance-repository';
import * as SessionInstanceExerciseRepo from '@/lib/db/repositories/session-instance-exercise-repository';
import { getDb } from '@/lib/db/client';

/**
 * Seeds a few demo exercises + "Push A" definition + open instance + sets.
 * Runs only when the exercises table is empty. Reference tables (implements,
 * muscles, manufacturers) are seeded by migration 005.
 */
export async function seedDatabaseIfEmpty(): Promise<boolean> {
  const db = await getDb();
  const row = await db.getFirstAsync<{ count: number }>(
    'SELECT COUNT(*) as count FROM exercises',
  );
  if ((row?.count ?? 0) > 0) return false;

  const smithIncline = await ExerciseRepo.createExercise({
    name: 'Smith high incline press',
    implementId: 'imp-smith',
    primaryMuscleId: 'mus-upper-chest',
    notes: 'Bench ~75°, feet flat, slight arch',
    secondaryMuscleIds: ['mus-front-delts', 'mus-triceps'],
  });
  await ExerciseRepo.createExercise({
    name: '30° dumbbell incline press',
    implementId: 'imp-dumbbell',
    primaryMuscleId: 'mus-upper-chest',
    secondaryMuscleIds: ['mus-front-delts', 'mus-triceps'],
  });
  const cableRow = await ExerciseRepo.createExercise({
    name: 'Neutral-grip lat-biased cable row',
    implementId: 'imp-cable',
    primaryMuscleId: 'mus-lats',
    secondaryMuscleIds: ['mus-upper-back', 'mus-biceps'],
  });
  await ExerciseRepo.createExercise({
    name: 'Leg press',
    implementId: 'imp-machine',
    primaryMuscleId: 'mus-quads',
    secondaryMuscleIds: ['mus-glutes'],
  });

  const pushA = await SessionRepo.createSession({
    name: 'Push A',
    status: 'active',
    rotationSortOrder: 0,
  });

  await SessionExerciseRepo.createSessionExercise({
    sessionId: pushA.id,
    exerciseId: smithIncline.id,
    sortOrder: 0,
    targetSets: 3,
    targetRepsMin: 8,
    targetRepsMax: 12,
    targetWeight: 185,
  });
  await SessionExerciseRepo.createSessionExercise({
    sessionId: pushA.id,
    exerciseId: cableRow.id,
    sortOrder: 1,
    targetSets: 2,
    targetRepsMin: 8,
    targetRepsMax: 10,
    prescriptionNotes: 'Focus on pause at stretch',
  });

  const now = new Date();
  const startedAt = new Date(now.getTime() - 47 * 60 * 1000).toISOString();
  const instance = await SessionInstanceRepo.createSessionInstance({
    sessionId: pushA.id,
    startedAt,
    bodyweight: 185,
  });

  const blockSmith = await SessionInstanceExerciseRepo.createSessionInstanceExercise({
    sessionInstanceId: instance.id,
    exerciseId: smithIncline.id,
    sortOrder: 0,
  });
  const blockRow = await SessionInstanceExerciseRepo.createSessionInstanceExercise({
    sessionInstanceId: instance.id,
    exerciseId: cableRow.id,
    sortOrder: 1,
    notes: 'Focus on pause at stretch',
  });

  const t0 = new Date(now.getTime() - 40 * 60 * 1000).toISOString();
  const t1 = new Date(now.getTime() - 35 * 60 * 1000).toISOString();
  const t2 = new Date(now.getTime() - 30 * 60 * 1000).toISOString();

  await SetRepo.createSet({
    exerciseId: smithIncline.id,
    performedAt: t0,
    sessionInstanceId: instance.id,
    sessionInstanceExerciseId: blockSmith.id,
    sortOrder: 1,
    weight: 185,
    reps: 8,
  });
  await SetRepo.createSet({
    exerciseId: smithIncline.id,
    performedAt: t1,
    sessionInstanceId: instance.id,
    sessionInstanceExerciseId: blockSmith.id,
    sortOrder: 2,
    weight: 175,
    reps: 10,
  });
  await SetRepo.createSet({
    exerciseId: smithIncline.id,
    performedAt: t2,
    sessionInstanceId: instance.id,
    sessionInstanceExerciseId: blockSmith.id,
    sortOrder: 3,
    weight: 165,
    reps: 12,
  });

  await SetRepo.createSet({
    exerciseId: cableRow.id,
    performedAt: new Date(now.getTime() - 20 * 60 * 1000).toISOString(),
    sessionInstanceId: instance.id,
    sessionInstanceExerciseId: blockRow.id,
    sortOrder: 1,
    weight: 140,
    reps: 10,
  });

  await SetRepo.createSet({
    exerciseId: smithIncline.id,
    performedAt: '2026-04-10T17:00:00.000Z',
    sessionInstanceId: null,
    sessionInstanceExerciseId: null,
    weight: 155,
    reps: 10,
    notes: 'Logged without a session',
  });

  await SetRepo.createSet({
    exerciseId: smithIncline.id,
    performedAt: '2026-03-12T18:30:00.000Z',
    sessionInstanceId: instance.id,
    sessionInstanceExerciseId: blockSmith.id,
    sortOrder: 1,
    weight: 180,
    reps: 8,
    notes: 'Prior top — demo compare target',
  });

  return true;
}
