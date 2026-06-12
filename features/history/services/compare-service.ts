import * as ExerciseRepo from '@/lib/db/repositories/exercise-repository';
import * as ReferenceRepo from '@/lib/db/repositories/reference-repository';
import * as SessionRepo from '@/lib/db/repositories/session-repository';
import * as SessionInstanceRepo from '@/lib/db/repositories/session-instance-repository';
import * as SetRepo from '@/lib/db/repositories/set-repository';
import * as SetVideoRepo from '@/lib/db/repositories/set-video-repository';
import type { CompareScope, HistorySetRow, Set, SetVideo } from '@/types/domain';

/** A set on either side of the compare screen, with exercise name for cross-exercise scopes. */
export type CompareSet = HistorySetRow & { exerciseName: string };

/** A candidate target, flagged when it lines up with the source (same lift, near load/reps). */
export type CompareCandidate = CompareSet & { comparable: boolean };

export type CompareData = {
  source: CompareSet;
  /** Primary muscle of the source exercise; null disables the "muscle" scope's widening. */
  primaryMuscleId: string | null;
  primaryMuscleName: string | null;
  /** Sorted comparable-first, then most recent first. Video-only. */
  candidates: CompareCandidate[];
  /** Most recent comparable candidate, else most recent candidate, else null. */
  defaultTargetId: string | null;
};

const WEIGHT_TOLERANCE = 0.05; // ±5%
const REPS_TOLERANCE = 2; // ±2

/** Same lift, load within ±5%, reps within ±2 (only compares values that exist on both). */
function isComparable(source: Set, candidate: Set): boolean {
  if (candidate.exerciseId !== source.exerciseId) return false;
  if (source.weight != null && candidate.weight != null) {
    const lo = source.weight * (1 - WEIGHT_TOLERANCE);
    const hi = source.weight * (1 + WEIGHT_TOLERANCE);
    if (candidate.weight < lo || candidate.weight > hi) return false;
  }
  if (source.reps != null && candidate.reps != null) {
    if (Math.abs(candidate.reps - source.reps) > REPS_TOLERANCE) return false;
  }
  return true;
}

async function sessionNameForSet(set: Set): Promise<string | null> {
  if (!set.sessionInstanceId) return null;
  const instance = await SessionInstanceRepo.getSessionInstanceById(set.sessionInstanceId);
  if (!instance) return 'Session';
  if (!instance.sessionId) return 'Session';
  const session = await SessionRepo.getSessionById(instance.sessionId);
  return session?.name ?? 'Session';
}

function buildEnricher(
  exerciseNames: Map<string, string>,
  manufacturerNames: Map<string, string>,
  videos: Map<string, SetVideo>,
) {
  return async (set: Set): Promise<CompareSet> => ({
    ...set,
    video: videos.get(set.id) ?? null,
    sessionName: await sessionNameForSet(set),
    manufacturerName: set.manufacturerId
      ? manufacturerNames.get(set.manufacturerId) ?? null
      : null,
    exerciseName: exerciseNames.get(set.exerciseId) ?? 'Unknown',
  });
}

export async function loadCompareData(
  setId: string,
  scope: CompareScope,
): Promise<CompareData | null> {
  const source = await SetRepo.getSetById(setId);
  if (!source) return null;

  const sourceExercise = await ExerciseRepo.getExerciseById(source.exerciseId);
  const primaryMuscleId = sourceExercise?.primaryMuscleId ?? null;
  const primaryMuscleName = primaryMuscleId
    ? (await ReferenceRepo.listMuscles()).find((m) => m.id === primaryMuscleId)?.name ?? null
    : null;

  const candidateSets = await SetRepo.listComparableVideoSets({
    scope,
    exerciseId: source.exerciseId,
    primaryMuscleId,
    excludeSetId: source.id,
  });

  // Names + videos for source and candidates in one pass.
  const allSets = [source, ...candidateSets];
  const exerciseIds = Array.from(new Set(allSets.map((s) => s.exerciseId)));
  const sourceVideo = await SetVideoRepo.getSetVideoBySetId(source.id);
  const candidateVideos = await SetVideoRepo.listSetVideosBySetIds(
    candidateSets.map((s) => s.id),
  );
  const videos = new Map(candidateVideos);
  if (sourceVideo) videos.set(sourceVideo.setId, sourceVideo);

  const [manufacturers, exercises] = await Promise.all([
    ReferenceRepo.listManufacturers(),
    Promise.all(exerciseIds.map((id) => ExerciseRepo.getExerciseById(id))),
  ]);
  const manufacturerNames = new Map(manufacturers.map((m) => [m.id, m.name]));
  const exerciseNames = new Map(
    exercises.filter((e): e is NonNullable<typeof e> => e != null).map((e) => [e.id, e.name]),
  );

  const enrich = buildEnricher(exerciseNames, manufacturerNames, videos);
  const enrichedSource = await enrich(source);
  const enrichedCandidates: CompareCandidate[] = await Promise.all(
    candidateSets.map(async (set) => ({
      ...(await enrich(set)),
      comparable: isComparable(source, set),
    })),
  );

  enrichedCandidates.sort((a, b) => {
    if (a.comparable !== b.comparable) return a.comparable ? -1 : 1;
    return b.performedAt.localeCompare(a.performedAt);
  });

  const defaultTargetId =
    enrichedCandidates.find((c) => c.comparable)?.id ?? enrichedCandidates[0]?.id ?? null;

  return {
    source: enrichedSource,
    primaryMuscleId,
    primaryMuscleName,
    candidates: enrichedCandidates,
    defaultTargetId,
  };
}
