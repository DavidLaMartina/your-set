import type {
  Exercise,
  ExerciseOrigin,
  Implement,
  Manufacturer,
  Muscle,
  Session,
  SessionExercise,
  SessionInstance,
  SessionInstanceExercise,
  SessionStatus,
  Set,
  SetType,
  SetVideo,
  VideoAvailabilityStatus,
} from '@/types/domain';
import type {
  ExerciseRow,
  ImplementRow,
  ManufacturerRow,
  MuscleRow,
  SessionExerciseRow,
  SessionInstanceExerciseRow,
  SessionInstanceRow,
  SessionRow,
  SetRow,
  SetVideoRow,
} from '@/lib/db/row-types';

export function mapImplementRow(row: ImplementRow): Implement {
  return { id: row.id, name: row.name, sortOrder: row.sort_order };
}

export function mapMuscleRow(row: MuscleRow): Muscle {
  return { id: row.id, name: row.name, region: row.region, sortOrder: row.sort_order };
}

export function mapManufacturerRow(row: ManufacturerRow): Manufacturer {
  return { id: row.id, name: row.name };
}

export function mapExerciseRow(row: ExerciseRow): Exercise {
  return {
    id: row.id,
    name: row.name,
    implementId: row.implement_id,
    primaryMuscleId: row.primary_muscle_id,
    manufacturerId: row.manufacturer_id,
    origin: row.origin as ExerciseOrigin,
    catalogId: row.catalog_id,
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapSessionRow(row: SessionRow): Session {
  return {
    id: row.id,
    name: row.name,
    status: row.status as SessionStatus,
    rotationSortOrder: row.rotation_sort_order,
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapSessionExerciseRow(row: SessionExerciseRow): SessionExercise {
  return {
    id: row.id,
    sessionId: row.session_id,
    exerciseId: row.exercise_id,
    sortOrder: row.sort_order,
    targetSets: row.target_sets,
    targetRepsMin: row.target_reps_min,
    targetRepsMax: row.target_reps_max,
    targetWeight: row.target_weight,
    prescriptionNotes: row.prescription_notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapSessionInstanceRow(row: SessionInstanceRow): SessionInstance {
  return {
    id: row.id,
    sessionId: row.session_id,
    startedAt: row.started_at,
    endedAt: row.ended_at,
    bodyweight: row.bodyweight,
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapSessionInstanceExerciseRow(
  row: SessionInstanceExerciseRow,
): SessionInstanceExercise {
  return {
    id: row.id,
    sessionInstanceId: row.session_instance_id,
    exerciseId: row.exercise_id,
    sortOrder: row.sort_order,
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapSetRow(row: SetRow): Set {
  return {
    id: row.id,
    exerciseId: row.exercise_id,
    performedAt: row.performed_at,
    sessionInstanceId: row.session_instance_id,
    sessionInstanceExerciseId: row.session_instance_exercise_id,
    sortOrder: row.sort_order,
    weight: row.weight,
    reps: row.reps,
    rir: row.rir,
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
