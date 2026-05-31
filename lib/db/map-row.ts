import type {
  Exercise,
  ExerciseVariant,
  Set,
  SetType,
  SetVideo,
  VideoAvailabilityStatus,
  Workout,
  WorkoutExercise,
} from '@/types/domain';
import type {
  ExerciseRow,
  ExerciseVariantRow,
  SetRow,
  SetVideoRow,
  WorkoutExerciseRow,
  WorkoutRow,
} from '@/lib/db/row-types';

export function mapExerciseRow(row: ExerciseRow): Exercise {
  return {
    id: row.id,
    name: row.name,
    defaultMuscleGroup: row.default_muscle_group,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapExerciseVariantRow(row: ExerciseVariantRow): ExerciseVariant {
  return {
    id: row.id,
    exerciseId: row.exercise_id,
    name: row.name,
    muscleGroup: row.muscle_group,
    equipment: row.equipment,
    setupNotes: row.setup_notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapWorkoutRow(row: WorkoutRow): Workout {
  return {
    id: row.id,
    name: row.name,
    startedAt: row.started_at,
    endedAt: row.ended_at,
    bodyweight: row.bodyweight,
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapWorkoutExerciseRow(row: WorkoutExerciseRow): WorkoutExercise {
  return {
    id: row.id,
    workoutId: row.workout_id,
    exerciseVariantId: row.exercise_variant_id,
    sortOrder: row.sort_order,
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapSetRow(row: SetRow): Set {
  return {
    id: row.id,
    exerciseVariantId: row.exercise_variant_id,
    performedAt: row.performed_at,
    workoutId: row.workout_id,
    workoutExerciseId: row.workout_exercise_id,
    sortOrder: row.sort_order,
    weight: row.weight,
    reps: row.reps,
    rir: row.rir,
    isFailure: row.is_failure !== 0,
    setType: row.set_type as SetType,
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapSetVideoRow(row: SetVideoRow): SetVideo {
  return {
    id: row.id,
    setId: row.set_id,
    assetId: row.asset_id,
    uri: row.uri,
    thumbnailUri: row.thumbnail_uri,
    durationMs: row.duration_ms,
    width: row.width,
    height: row.height,
    cameraAngle: row.camera_angle as SetVideo['cameraAngle'],
    notes: row.notes,
    availabilityStatus: row.availability_status as VideoAvailabilityStatus,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapSetToRow(set: Set): SetRow {
  return {
    id: set.id,
    exercise_variant_id: set.exerciseVariantId,
    performed_at: set.performedAt,
    workout_id: set.workoutId,
    workout_exercise_id: set.workoutExerciseId,
    sort_order: set.sortOrder,
    weight: set.weight,
    reps: set.reps,
    rir: set.rir,
    is_failure: set.isFailure ? 1 : 0,
    set_type: set.setType,
    notes: set.notes,
    created_at: set.createdAt,
    updated_at: set.updatedAt,
  };
}
