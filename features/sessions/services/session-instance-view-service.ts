import * as ExerciseRepo from '@/lib/db/repositories/exercise-repository';
import * as SessionRepo from '@/lib/db/repositories/session-repository';
import * as SessionInstanceRepo from '@/lib/db/repositories/session-instance-repository';
import * as SessionInstanceExerciseRepo from '@/lib/db/repositories/session-instance-exercise-repository';
import * as SetRepo from '@/lib/db/repositories/set-repository';
import * as SetVideoRepo from '@/lib/db/repositories/set-video-repository';
import type { SessionExerciseBlock, SessionInstanceView, SetWithVideo } from '@/types/domain';

async function enrichBlock(
  sessionInstanceId: string,
  block: Awaited<ReturnType<typeof SessionInstanceExerciseRepo.listSessionInstanceExercises>>[number],
): Promise<SessionExerciseBlock | null> {
  const exercise = await ExerciseRepo.getExerciseById(block.exerciseId);
  if (!exercise) return null;

  const sets = await SetRepo.listSetsBySessionInstanceAndExercise(
    sessionInstanceId,
    block.exerciseId,
  );
  const videos = await SetVideoRepo.listSetVideosBySetIds(sets.map((s) => s.id));
  const setsWithVideo: SetWithVideo[] = sets.map((set) => ({
    ...set,
    video: videos.get(set.id) ?? null,
  }));

  return { ...block, exercise, sets: setsWithVideo };
}

export async function loadSessionInstanceView(
  sessionInstanceId: string,
): Promise<SessionInstanceView | null> {
  const instance = await SessionInstanceRepo.getSessionInstanceById(sessionInstanceId);
  if (!instance) return null;

  let sessionName: string | null = null;
  if (instance.sessionId) {
    const session = await SessionRepo.getSessionById(instance.sessionId);
    sessionName = session?.name ?? null;
  }

  const blocks = await SessionInstanceExerciseRepo.listSessionInstanceExercises(instance.id);
  const enriched = (
    await Promise.all(blocks.map((block) => enrichBlock(instance.id, block)))
  ).filter((b): b is SessionExerciseBlock => b != null);

  return { ...instance, sessionName, blocks: enriched };
}
