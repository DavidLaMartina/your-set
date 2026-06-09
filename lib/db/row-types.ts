/**
 * SQLite row shapes (snake_case). Map to types/domain.ts (camelCase) in repositories.
 */

export type ImplementRow = {
  id: string;
  name: string;
  sort_order: number;
};

export type MuscleRow = {
  id: string;
  name: string;
  region: string | null;
  sort_order: number;
};

export type ManufacturerRow = {
  id: string;
  name: string;
};

export type ExerciseRow = {
  id: string;
  name: string;
  implement_id: string | null;
  primary_muscle_id: string | null;
  origin: string;
  catalog_id: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type SessionRow = {
  id: string;
  name: string;
  status: string;
  rotation_sort_order: number | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type SessionExerciseRow = {
  id: string;
  session_id: string;
  exercise_id: string;
  sort_order: number;
  target_sets: number | null;
  target_reps_min: number | null;
  target_reps_max: number | null;
  target_weight: number | null;
  prescription_notes: string | null;
  created_at: string;
  updated_at: string;
};

export type SessionInstanceRow = {
  id: string;
  session_id: string | null;
  started_at: string;
  ended_at: string | null;
  bodyweight: number | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type SessionInstanceExerciseRow = {
  id: string;
  session_instance_id: string;
  exercise_id: string;
  sort_order: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type SetRow = {
  id: string;
  exercise_id: string;
  performed_at: string;
  session_instance_id: string | null;
  session_instance_exercise_id: string | null;
  sort_order: number | null;
  weight: number | null;
  reps: number | null;
  manufacturer_id: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type SetVideoRow = {
  id: string;
  set_id: string;
  asset_id: string | null;
  uri: string | null;
  thumbnail_uri: string | null;
  duration_ms: number | null;
  width: number | null;
  height: number | null;
  camera_angle: string | null;
  notes: string | null;
  availability_status: string;
  created_at: string;
  updated_at: string;
};
