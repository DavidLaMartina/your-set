import { MOCK_IDS } from '@/features/mock-data/ids';
import type {
  SessionInstanceView,
  Exercise,
  ExerciseVariant,
  HistorySetRow,
  Set,
  SetVideo,
  SetWithVideo,
  VariantHistoryView,
  SessionExerciseBlock,
} from '@/types/domain';

const now = new Date();
const startedAt = new Date(now.getTime() - 47 * 60 * 1000).toISOString();

const exercises: Exercise[] = [
  {
    id: MOCK_IDS.exerciseInclinePress,
    name: 'Incline Press',
    defaultMuscleGroup: 'chest',
    createdAt: '2025-01-01T00:00:00.000Z',
    updatedAt: '2025-01-01T00:00:00.000Z',
  },
  {
    id: MOCK_IDS.exerciseRow,
    name: 'Row',
    defaultMuscleGroup: 'back',
    createdAt: '2025-01-01T00:00:00.000Z',
    updatedAt: '2025-01-01T00:00:00.000Z',
  },
  {
    id: 'exercise-leg-press',
    name: 'Leg Press',
    defaultMuscleGroup: 'quads',
    createdAt: '2025-01-01T00:00:00.000Z',
    updatedAt: '2025-01-01T00:00:00.000Z',
  },
];

const variants: ExerciseVariant[] = [
  {
    id: MOCK_IDS.variantSmithIncline,
    exerciseId: MOCK_IDS.exerciseInclinePress,
    name: 'Smith high incline',
    muscleGroup: 'chest',
    equipment: 'smith',
    setupNotes: 'Bench ~75°, feet flat, slight arch',
    createdAt: '2025-01-01T00:00:00.000Z',
    updatedAt: '2025-01-01T00:00:00.000Z',
  },
  {
    id: 'variant-db-incline',
    exerciseId: MOCK_IDS.exerciseInclinePress,
    name: '30° dumbbell incline',
    muscleGroup: 'chest',
    equipment: 'dumbbell',
    setupNotes: null,
    createdAt: '2025-01-01T00:00:00.000Z',
    updatedAt: '2025-01-01T00:00:00.000Z',
  },
  {
    id: MOCK_IDS.variantCableRow,
    exerciseId: MOCK_IDS.exerciseRow,
    name: 'Neutral-grip lat-biased cable row',
    muscleGroup: 'back',
    equipment: 'cable',
    setupNotes: 'Elbows slightly flared, pause at sternum',
    createdAt: '2025-01-01T00:00:00.000Z',
    updatedAt: '2025-01-01T00:00:00.000Z',
  },
  {
    id: 'variant-cs-row',
    exerciseId: MOCK_IDS.exerciseRow,
    name: 'Chest-supported upper-back row',
    muscleGroup: 'back',
    equipment: 'machine',
    setupNotes: null,
    createdAt: '2025-01-01T00:00:00.000Z',
    updatedAt: '2025-01-01T00:00:00.000Z',
  },
];

type MakeSetInput = Pick<Set, 'id' | 'exerciseVariantId' | 'performedAt'> &
  Partial<Omit<Set, 'id' | 'exerciseVariantId' | 'performedAt'>>;

function makeSet(partial: MakeSetInput): Set {
  const audit = partial.performedAt;
  return {
    sessionInstanceId: null,
    sessionInstanceExerciseId: null,
    sortOrder: null,
    weight: null,
    reps: null,
    rir: null,
    isFailure: false,
    setType: 'straight',
    notes: null,
    createdAt: audit,
    updatedAt: audit,
    ...partial,
  };
}

function inSession(
  set: MakeSetInput,
  sessionInstanceId: string,
  sessionInstanceExerciseId: string,
  sortOrder: number,
): MakeSetInput {
  return { ...set, sessionInstanceId, sessionInstanceExerciseId, sortOrder };
}

function makeVideo(
  partial: Pick<SetVideo, 'setId' | 'availabilityStatus'> & Partial<SetVideo>,
): SetVideo {
  const ts = '2026-05-31T12:00:00.000Z';
  return {
    id: `video-${partial.setId}`,
    assetId: null,
    uri: null,
    thumbnailUri: null,
    durationMs: null,
    width: null,
    height: null,
    cameraAngle: 'side',
    notes: null,
    createdAt: ts,
    updatedAt: ts,
    ...partial,
  };
}

function withVideo(set: Set, video: SetVideo | null): SetWithVideo {
  return { ...set, video };
}

const t0 = new Date(now.getTime() - 40 * 60 * 1000).toISOString();
const t1 = new Date(now.getTime() - 35 * 60 * 1000).toISOString();
const t2 = new Date(now.getTime() - 30 * 60 * 1000).toISOString();
const tRow0 = new Date(now.getTime() - 20 * 60 * 1000).toISOString();
const tRow1 = new Date(now.getTime() - 15 * 60 * 1000).toISOString();

const smithSets: SetWithVideo[] = [
  withVideo(
    makeSet(
      inSession(
        {
          id: MOCK_IDS.setTodayTop,
          exerciseVariantId: MOCK_IDS.variantSmithIncline,
          performedAt: t0,
          weight: 185,
          reps: 8,
          rir: 1,
          setType: 'top_set',
        },
        MOCK_IDS.workoutActive,
        MOCK_IDS.blockSmithIncline,
        1,
      ),
    ),
    makeVideo({
      setId: MOCK_IDS.setTodayTop,
      availabilityStatus: 'available',
      durationMs: 12400,
      cameraAngle: 'side',
    }),
  ),
  withVideo(
    makeSet(
      inSession(
        {
          id: MOCK_IDS.setTodayBackoff,
          exerciseVariantId: MOCK_IDS.variantSmithIncline,
          performedAt: t1,
          weight: 175,
          reps: 10,
          rir: 2,
          setType: 'backoff',
        },
        MOCK_IDS.workoutActive,
        MOCK_IDS.blockSmithIncline,
        2,
      ),
    ),
    null,
  ),
  withVideo(
    makeSet(
      inSession(
        {
          id: MOCK_IDS.setTodayMissingVideo,
          exerciseVariantId: MOCK_IDS.variantSmithIncline,
          performedAt: t2,
          weight: 165,
          reps: 12,
          setType: 'backoff',
          notes: 'Last set — video was on phone, may need relink',
        },
        MOCK_IDS.workoutActive,
        MOCK_IDS.blockSmithIncline,
        3,
      ),
    ),
    makeVideo({
      setId: MOCK_IDS.setTodayMissingVideo,
      availabilityStatus: 'missing',
    }),
  ),
];

const rowSets: SetWithVideo[] = [
  withVideo(
    makeSet(
      inSession(
        {
          id: 'set-row-1',
          exerciseVariantId: MOCK_IDS.variantCableRow,
          performedAt: tRow0,
          weight: 140,
          reps: 10,
          setType: 'top_set',
        },
        MOCK_IDS.workoutActive,
        MOCK_IDS.blockCableRow,
        1,
      ),
    ),
    makeVideo({
      setId: 'set-row-1',
      availabilityStatus: 'available',
      cameraAngle: 'front45',
    }),
  ),
  withVideo(
    makeSet(
      inSession(
        {
          id: 'set-row-2',
          exerciseVariantId: MOCK_IDS.variantCableRow,
          performedAt: tRow1,
          weight: 130,
          reps: 12,
          setType: 'straight',
        },
        MOCK_IDS.workoutActive,
        MOCK_IDS.blockCableRow,
        2,
      ),
    ),
    null,
  ),
];

const priorDate = '2026-03-12T18:30:00.000Z';
const priorDate2 = '2026-02-28T18:30:00.000Z';
const orphanDate = '2026-04-10T17:00:00.000Z';

/** Set-only log: no workout_id — appears in variant history, not tied to a session. */
export const mockOrphanSet: SetWithVideo = withVideo(
  makeSet({
    id: MOCK_IDS.setOrphanSmith,
    exerciseVariantId: MOCK_IDS.variantSmithIncline,
    performedAt: orphanDate,
    weight: 155,
    reps: 10,
    setType: 'straight',
    notes: 'Logged without a session',
  }),
  null,
);

export const mockPriorCompareSet: SetWithVideo = withVideo(
  makeSet(
    inSession(
      {
        id: MOCK_IDS.setPriorCompare,
        exerciseVariantId: MOCK_IDS.variantSmithIncline,
        performedAt: priorDate,
        weight: 180,
        reps: 8,
        rir: 2,
        setType: 'top_set',
        notes: 'Felt heavy off chest',
      },
      MOCK_IDS.workoutActive,
      'we-prior',
      1,
    ),
  ),
  makeVideo({
    setId: MOCK_IDS.setPriorCompare,
    availabilityStatus: 'available',
    durationMs: 11800,
    cameraAngle: 'side',
  }),
);

function buildBlock(
  blockId: string,
  variantId: string,
  sortOrder: number,
  sets: SetWithVideo[],
  notes: string | null = null,
): SessionExerciseBlock {
  const variant = variants.find((v) => v.id === variantId)!;
  const exercise = exercises.find((e) => e.id === variant.exerciseId)!;
  const ts = '2026-05-31T12:00:00.000Z';
  return {
    id: blockId,
    sessionInstanceId: MOCK_IDS.workoutActive,
    exerciseVariantId: variantId,
    sortOrder,
    notes,
    createdAt: ts,
    updatedAt: ts,
    variant,
    exercise,
    sets,
  };
}

export const mockActiveSessionInstance: SessionInstanceView = {
  id: MOCK_IDS.workoutActive,
  sessionId: 'session-push-a',
  sessionName: 'Push A',
  startedAt,
  endedAt: null,
  bodyweight: 185,
  notes: null,
  createdAt: startedAt,
  updatedAt: startedAt,
  blocks: [
    buildBlock(MOCK_IDS.blockSmithIncline, MOCK_IDS.variantSmithIncline, 0, smithSets),
    buildBlock(
      MOCK_IDS.blockCableRow,
      MOCK_IDS.variantCableRow,
      1,
      rowSets,
      'Focus on pause at stretch',
    ),
  ],
};

function historyRow(set: Set, video: SetVideo | null, sessionName: string | null): HistorySetRow {
  return { ...set, video, sessionName };
}

export function getMockSetById(setId: string): SetWithVideo | undefined {
  const allSets = [
    ...smithSets,
    ...rowSets,
    mockPriorCompareSet,
    mockOrphanSet,
    withVideo(
      makeSet(
        inSession(
          {
            id: MOCK_IDS.setHistory1,
            exerciseVariantId: MOCK_IDS.variantSmithIncline,
            performedAt: priorDate2,
            weight: 175,
            reps: 8,
            setType: 'top_set',
          },
          'workout-old-1',
          'we-h1',
          1,
        ),
      ),
      makeVideo({ setId: MOCK_IDS.setHistory1, availabilityStatus: 'available' }),
    ),
    withVideo(
      makeSet(
        inSession(
          {
            id: MOCK_IDS.setHistory2,
            exerciseVariantId: MOCK_IDS.variantSmithIncline,
            performedAt: '2026-01-15T18:30:00.000Z',
            weight: 170,
            reps: 9,
            setType: 'top_set',
          },
          'workout-old-2',
          'we-h2',
          1,
        ),
      ),
      null,
    ),
  ];
  return allSets.find((s) => s.id === setId);
}

export function getMockVariantHistory(variantId: string): VariantHistoryView | null {
  const variant = variants.find((v) => v.id === variantId);
  if (!variant) return null;
  const exercise = exercises.find((e) => e.id === variant.exerciseId)!;

  const allForVariant = [
    ...smithSets,
    mockPriorCompareSet,
    mockOrphanSet,
    getMockSetById(MOCK_IDS.setHistory1)!,
    getMockSetById(MOCK_IDS.setHistory2)!,
  ].filter((s) => s.exerciseVariantId === variantId);

  const recentSets: HistorySetRow[] = [...allForVariant]
    .sort((a, b) => new Date(b.performedAt).getTime() - new Date(a.performedAt).getTime())
    .map((s) =>
      historyRow(
        s,
        s.video,
        s.sessionInstanceId
          ? s.sessionInstanceId === MOCK_IDS.workoutActive
            ? 'Push A'
            : 'Prior session'
          : null,
      ),
    );

  const bestSets = [...recentSets].sort((a, b) => (b.weight ?? 0) - (a.weight ?? 0)).slice(0, 3);

  const comparableSets = recentSets.filter(
    (s) => s.id !== MOCK_IDS.setTodayTop && s.setType === 'top_set',
  );

  return { variant, exercise, recentSets, bestSets, comparableSets };
}

export const mockExerciseLibrary = exercises.map((exercise) => ({
  exercise,
  variants: variants.filter((v) => v.exerciseId === exercise.id),
}));

export function formatSetLabel(weight: number | null, reps: number | null): string {
  if (weight == null && reps == null) return '—';
  if (weight == null) return `${reps} reps`;
  if (reps == null) return `${weight}`;
  return `${weight} × ${reps}`;
}

export function formatWorkoutElapsed(startedAtIso: string): string {
  const ms = Date.now() - new Date(startedAtIso).getTime();
  const mins = Math.floor(ms / 60000);
  if (mins < 60) return `${mins}m`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${h}h ${m}m`;
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

/** Date + time from performedAt (set-first display). */
export function formatPerformedAt(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}
