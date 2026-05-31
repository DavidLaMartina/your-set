export const SET_TYPES = [
  'straight',
  'top_set',
  'backoff',
  'rest_pause',
  'myo_rep',
  'cluster',
  'drop_set',
  'partials',
  'bfr',
  'forced_reps',
  'other',
] as const;

export type SetType = (typeof SET_TYPES)[number];

export const SET_TYPE_LABELS: Record<SetType, string> = {
  straight: 'Straight',
  top_set: 'Top',
  backoff: 'Backoff',
  rest_pause: 'Rest-pause',
  myo_rep: 'Myo',
  cluster: 'Cluster',
  drop_set: 'Drop',
  partials: 'Partials',
  bfr: 'BFR',
  forced_reps: 'Forced',
  other: 'Other',
};

export const CAMERA_ANGLES = [
  'front',
  'side',
  'rear',
  'front45',
  'rear45',
  'other',
] as const;

export type CameraAngle = (typeof CAMERA_ANGLES)[number];

export const VIDEO_AVAILABILITY = [
  'available',
  'missing',
  'permissionDenied',
  'unknown',
] as const;

export type VideoAvailabilityStatus = (typeof VIDEO_AVAILABILITY)[number];

export type Exercise = {
  id: string;
  name: string;
  defaultMuscleGroup: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ExerciseVariant = {
  id: string;
  exerciseId: string;
  name: string;
  muscleGroup: string | null;
  equipment: string | null;
  setupNotes: string | null;
  createdAt: string;
  updatedAt: string;
};

/** Optional session container. endedAt is never required. */
export type Workout = {
  id: string;
  name: string | null;
  startedAt: string;
  endedAt: string | null;
  bodyweight: number | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
};

/** Optional block within a session (order, block notes). Not required to log a set. */
export type WorkoutExercise = {
  id: string;
  workoutId: string;
  exerciseVariantId: string;
  sortOrder: number;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
};

/**
 * Atomic log entry. Canonical time is performedAt — never inferred from the session.
 * workoutId / workoutExerciseId are optional (set-only logging).
 */
export type Set = {
  id: string;
  exerciseVariantId: string;
  performedAt: string;
  workoutId: string | null;
  workoutExerciseId: string | null;
  /** Order within a session block; null when logged outside a session. */
  sortOrder: number | null;
  weight: number | null;
  reps: number | null;
  rir: number | null;
  isFailure: boolean;
  setType: SetType;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
};

export type SetVideo = {
  id: string;
  setId: string;
  assetId: string | null;
  uri: string | null;
  thumbnailUri: string | null;
  durationMs: number | null;
  width: number | null;
  height: number | null;
  cameraAngle: CameraAngle | null;
  notes: string | null;
  availabilityStatus: VideoAvailabilityStatus;
  createdAt: string;
  updatedAt: string;
};

/** Filters for set-first queries (variant / exercise / date / load). */
export type SetListFilters = {
  exerciseVariantId?: string;
  exerciseId?: string;
  workoutId?: string;
  performedAtFrom?: string;
  performedAtTo?: string;
  weightMin?: number;
  weightMax?: number;
  repsMin?: number;
  repsMax?: number;
  setTypes?: SetType[];
};

/** Enriched types for UI */

export type SetWithVideo = Set & {
  video: SetVideo | null;
};

export type WorkoutExerciseBlock = WorkoutExercise & {
  variant: ExerciseVariant;
  exercise: Exercise;
  sets: SetWithVideo[];
};

export type ActiveWorkoutView = Workout & {
  blocks: WorkoutExerciseBlock[];
};

/** Variant-first history row; performedAt on Set is source of truth for date/time. */
export type HistorySetRow = SetWithVideo & {
  /** Session label when workoutId is set; null for set-only logs. */
  workoutName: string | null;
};

export type VariantHistoryView = {
  variant: ExerciseVariant;
  exercise: Exercise;
  recentSets: HistorySetRow[];
  bestSets: HistorySetRow[];
  comparableSets: HistorySetRow[];
};
