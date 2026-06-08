import type { Href } from 'expo-router';

export function sessionsTabHref(): Href {
  return '/(tabs)/sessions' as Href;
}

export function workoutsTabHref(): Href {
  return '/(tabs)/workouts' as Href;
}

export function exercisesTabHref(): Href {
  return '/(tabs)/exercises' as Href;
}

export function sessionDetailHref(sessionInstanceId: string): Href {
  return `/session/${sessionInstanceId}` as Href;
}

export function sessionDefinitionHref(sessionId: string): Href {
  return `/sessions/${sessionId}` as Href;
}

export function setDetailHref(setId: string): Href {
  return `/set/${setId}` as Href;
}

/** Open the set screen directly in edit mode. */
export function editSetHref(setId: string): Href {
  return `/set/${setId}?edit=1` as Href;
}

export function setCompareHref(setId: string): Href {
  return `/set/${setId}/compare` as Href;
}

/** Exercise detail = set history + manage. */
export function exerciseDetailHref(exerciseId: string): Href {
  return `/exercises/${exerciseId}` as Href;
}

export function newExerciseHref(): Href {
  return '/exercises/new' as Href;
}

export function editExerciseHref(exerciseId: string): Href {
  return `/exercises/new?exerciseId=${exerciseId}` as Href;
}

export function setsTabHref(): Href {
  return '/(tabs)/sets' as Href;
}

export type LogSetParams = {
  exerciseId: string;
  sessionInstanceId?: string;
  sessionInstanceExerciseId?: string;
  /** After save, navigate here instead of set detail (set-only logs). */
  returnTo?: 'sets';
};

/** Create a new set. Editing an existing set happens on the set screen itself. */
export function logSetHref(params: LogSetParams): Href {
  const q = new URLSearchParams();
  q.set('exerciseId', params.exerciseId);
  if (params.sessionInstanceId) q.set('sessionInstanceId', params.sessionInstanceId);
  if (params.sessionInstanceExerciseId) {
    q.set('sessionInstanceExerciseId', params.sessionInstanceExerciseId);
  }
  if (params.returnTo) q.set('returnTo', params.returnTo);
  return `/set/log?${q.toString()}` as Href;
}

export type ExercisePickerPurpose = 'session-definition' | 'workout' | 'log-set';

export function exercisePickerHref(purpose: ExercisePickerPurpose, targetId: string): Href {
  const q = new URLSearchParams({ purpose, targetId });
  return `/picker/exercise?${q.toString()}` as Href;
}

/** Pick an exercise, then open the set log form (no workout). */
export function exercisePickerForLogSetHref(): Href {
  return '/picker/exercise?purpose=log-set' as Href;
}
