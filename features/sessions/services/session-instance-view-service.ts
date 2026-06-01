import * as ExerciseRepo from '@/lib/db/repositories/exercise-repository';
import * as VariantRepo from '@/lib/db/repositories/exercise-variant-repository';
import * as SessionRepo from '@/lib/db/repositories/session-repository';
import * as SessionInstanceRepo from '@/lib/db/repositories/session-instance-repository';
import * as SessionInstanceExerciseRepo from '@/lib/db/repositories/session-instance-exercise-repository';
import * as SetRepo from '@/lib/db/repositories/set-repository';
import type { SessionExerciseBlock, SessionInstanceView, SetWithVideo } from '@/types/domain';

async function enrichBlock(
  sessionInstanceId: string,
  block: Awaited<ReturnType<typeof SessionInstanceExerciseRepo.listSessionInstanceExercises>>[number],
): Promise<SessionExerciseBlock | null> {
  const variant = await VariantRepo.getVariantById(block.exerciseVariantId);
  if (!variant) return null;
  const exercise = await ExerciseRepo.getExerciseById(variant.exerciseId);
  if (!exercise) return null;

  const sets = await SetRepo.listSetsBySessionInstanceAndVariant(
    sessionInstanceId,
    block.exerciseVariantId,
  );
  const setsWithVideo: SetWithVideo[] = sets.map((set) => ({ ...set, video: null }));

  return { ...block, variant, exercise, sets: setsWithVideo };
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
