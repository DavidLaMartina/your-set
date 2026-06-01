import * as ExerciseRepo from '@/lib/db/repositories/exercise-repository';
import * as VariantRepo from '@/lib/db/repositories/exercise-variant-repository';
import * as SetRepo from '@/lib/db/repositories/set-repository';
import * as SessionRepo from '@/lib/db/repositories/session-repository';
import * as SessionExerciseRepo from '@/lib/db/repositories/session-exercise-repository';
import * as SessionInstanceRepo from '@/lib/db/repositories/session-instance-repository';
import * as SessionInstanceExerciseRepo from '@/lib/db/repositories/session-instance-exercise-repository';
import { getDb } from '@/lib/db/client';
import { isoNow } from '@/lib/db/timestamps';

/**
 * Seeds sample library + session definition "Push A" + open instance + sets.
 * Runs only when the exercises table is empty.
 */
export async function seedDatabaseIfEmpty(): Promise<boolean> {
  const db = await getDb();
  const row = await db.getFirstAsync<{ count: number }>(
    'SELECT COUNT(*) as count FROM exercises',
  );
  if ((row?.count ?? 0) > 0) return false;

  const incline = await ExerciseRepo.createExercise({
    name: 'Incline Press',
    defaultMuscleGroup: 'chest',
  });
  const rowExercise = await ExerciseRepo.createExercise({
    name: 'Row',
    defaultMuscleGroup: 'back',
  });

  const smith = await VariantRepo.createVariant({
    exerciseId: incline.id,
    name: 'Smith high incline',
    muscleGroup: 'chest',
    equipment: 'smith',
    setupNotes: 'Bench ~75°, feet flat, slight arch',
  });
  await VariantRepo.createVariant({
    exerciseId: incline.id,
    name: '30° dumbbell incline',
    equipment: 'dumbbell',
  });
  const cableRow = await VariantRepo.createVariant({
    exerciseId: rowExercise.id,
    name: 'Neutral-grip lat-biased cable row',
    muscleGroup: 'back',
    equipment: 'cable',
  });

  const pushA = await SessionRepo.createSession({
    name: 'Push A',
    status: 'active',
    rotationSortOrder: 0,
  });

  await SessionExerciseRepo.createSessionExercise({
    sessionId: pushA.id,
    exerciseVariantId: smith.id,
    sortOrder: 0,
    targetSets: 3,
    targetRepsMin: 8,
    targetRepsMax: 12,
    targetWeight: 185,
  });
  await SessionExerciseRepo.createSessionExercise({
    sessionId: pushA.id,
    exerciseVariantId: cableRow.id,
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
    exerciseVariantId: smith.id,
    sortOrder: 0,
  });
  const blockRow = await SessionInstanceExerciseRepo.createSessionInstanceExercise({
    sessionInstanceId: instance.id,
    exerciseVariantId: cableRow.id,
    sortOrder: 1,
    notes: 'Focus on pause at stretch',
  });

  const t0 = new Date(now.getTime() - 40 * 60 * 1000).toISOString();
  const t1 = new Date(now.getTime() - 35 * 60 * 1000).toISOString();
  const t2 = new Date(now.getTime() - 30 * 60 * 1000).toISOString();

  await SetRepo.createSet({
    exerciseVariantId: smith.id,
    performedAt: t0,
    sessionInstanceId: instance.id,
    sessionInstanceExerciseId: blockSmith.id,
    sortOrder: 1,
    weight: 185,
    reps: 8,
    rir: 1,
    setType: 'top_set',
  });
  await SetRepo.createSet({
    exerciseVariantId: smith.id,
    performedAt: t1,
    sessionInstanceId: instance.id,
    sessionInstanceExerciseId: blockSmith.id,
    sortOrder: 2,
    weight: 175,
    reps: 10,
    rir: 2,
    setType: 'backoff',
  });
  await SetRepo.createSet({
    exerciseVariantId: smith.id,
    performedAt: t2,
    sessionInstanceId: instance.id,
    sessionInstanceExerciseId: blockSmith.id,
    sortOrder: 3,
    weight: 165,
    reps: 12,
    setType: 'backoff',
  });

  await SetRepo.createSet({
    exerciseVariantId: cableRow.id,
    performedAt: new Date(now.getTime() - 20 * 60 * 1000).toISOString(),
    sessionInstanceId: instance.id,
    sessionInstanceExerciseId: blockRow.id,
    sortOrder: 1,
    weight: 140,
    reps: 10,
    setType: 'top_set',
  });

  await SetRepo.createSet({
    exerciseVariantId: smith.id,
    performedAt: '2026-04-10T17:00:00.000Z',
    sessionInstanceId: null,
    sessionInstanceExerciseId: null,
    weight: 155,
    reps: 10,
    notes: 'Logged without a session',
  });

  await SetRepo.createSet({
    exerciseVariantId: smith.id,
    performedAt: '2026-03-12T18:30:00.000Z',
    sessionInstanceId: instance.id,
    sessionInstanceExerciseId: blockSmith.id,
    sortOrder: 1,
    weight: 180,
    reps: 8,
    rir: 2,
    setType: 'top_set',
    notes: 'Prior top — demo compare target',
  });

  void isoNow();

  return true;
}
