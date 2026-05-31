/**
 * SQLite row shapes (snake_case). Map to types/domain.ts (camelCase) in repositories.
 */

export type ExerciseRow = {
  id: string;
  name: string;
  default_muscle_group: string | null;
  created_at: string;
  updated_at: string;
};

export type ExerciseVariantRow = {
  id: string;
  exercise_id: string;
  name: string;
  muscle_group: string | null;
  equipment: string | null;
  setup_notes: string | null;
  created_at: string;
  updated_at: string;
};

export type WorkoutRow = {
  id: string;
  name: string | null;
  started_at: string;
  ended_at: string | null;
  bodyweight: number | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type WorkoutExerciseRow = {
  id: string;
  workout_id: string;
  exercise_variant_id: string;
  sort_order: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type SetRow = {
  id: string;
  exercise_variant_id: string;
  performed_at: string;
  workout_id: string | null;
  workout_exercise_id: string | null;
  sort_order: number | null;
  weight: number | null;
  reps: number | null;
  rir: number | null;
  is_failure: number;
  set_type: string;
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
