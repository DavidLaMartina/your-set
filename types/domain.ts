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

/** Reference (stock) lookups. */
export type Implement = {
  id: string;
  name: string;
  sortOrder: number;
};

export type Muscle = {
  id: string;
  name: string;
  region: string | null;
  sortOrder: number;
};

export type Manufacturer = {
  id: string;
  name: string;
};

export const EXERCISE_ORIGINS = ['stock', 'custom'] as const;
export type ExerciseOrigin = (typeof EXERCISE_ORIGINS)[number];

/**
 * The single loggable movement (variants were folded into this in schema v5).
 * implement / primaryMuscle are nullable so users can jot a name on the fly;
 * anything promoted into the shared library should set both.
 */
export type Exercise = {
  id: string;
  name: string;
  implementId: string | null;
  primaryMuscleId: string | null;
  manufacturerId: string | null;
  /** 'stock' = shared/library row; 'custom' = user-created. */
  origin: ExerciseOrigin;
  /** Points at the stock row this was copied/customized from (future cloud library). */
  catalogId: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
};

/** Exercise joined with reference names + secondary muscles for display. */
export type ExerciseWithMeta = Exercise & {
  implementName: string | null;
  primaryMuscleName: string | null;
  manufacturerName: string | null;
  secondaryMuscles: Muscle[];
};

export const SESSION_STATUSES = ['active', 'retired'] as const;
export type SessionStatus = (typeof SESSION_STATUSES)[number];

/** Session definition — rotation slot with planned exercises (session_exercises). */
export type Session = {
  id: string;
  name: string;
  status: SessionStatus;
  rotationSortOrder: number | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
};

/** Planned exercise on a session definition (default prescriptions). */
export type SessionExercise = {
  id: string;
  sessionId: string;
  exerciseId: string;
  sortOrder: number;
  targetSets: number | null;
  targetRepsMin: number | null;
  targetRepsMax: number | null;
  targetWeight: number | null;
  prescriptionNotes: string | null;
  createdAt: string;
  updatedAt: string;
};

/** One gym visit. endedAt is never required. */
export type SessionInstance = {
  id: string;
  sessionId: string | null;
  startedAt: string;
  endedAt: string | null;
  bodyweight: number | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
};

/** Block within an instance (order, block notes). Not required to log a set. */
export type SessionInstanceExercise = {
  id: string;
  sessionInstanceId: string;
  exerciseId: string;
  sortOrder: number;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
};

/**
 * Atomic log entry. Canonical time is performedAt — never inferred from the session.
 * sessionInstanceId / sessionInstanceExerciseId are optional (set-only logging).
 */
export type Set = {
  id: string;
  exerciseId: string;
  performedAt: string;
  sessionInstanceId: string | null;
  sessionInstanceExerciseId: string | null;
  /** Order within a session block; null when logged outside a session. */
  sortOrder: number | null;
  weight: number | null;
  reps: number | null;
  rir: number | null;
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

/** Filters for set-first queries (exercise / date / load). */
export type SetListFilters = {
  exerciseId?: string;
  sessionInstanceId?: string;
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

export type SessionExerciseBlock = SessionInstanceExercise & {
  exercise: Exercise;
  sets: SetWithVideo[];
};

export type SessionInstanceView = SessionInstance & {
  /** Definition name when sessionId is set. */
  sessionName: string | null;
  blocks: SessionExerciseBlock[];
};

/** Exercise-first history row; performedAt on Set is source of truth for date/time. */
export type HistorySetRow = SetWithVideo & {
  /** Definition label when instance is linked; null for set-only logs. */
  sessionName: string | null;
};

export type ExerciseHistoryView = {
  exercise: ExerciseWithMeta;
  recentSets: HistorySetRow[];
  bestSets: HistorySetRow[];
  comparableSets: HistorySetRow[];
};
