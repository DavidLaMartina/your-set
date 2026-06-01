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

export function variantHistoryHref(variantId: string): Href {
  return `/variant/${variantId}/history` as Href;
}

export function setDetailHref(setId: string): Href {
  return `/set/${setId}` as Href;
}

export function setCompareHref(setId: string): Href {
  return `/set/${setId}/compare` as Href;
}

export function exerciseDetailHref(exerciseId: string): Href {
  return `/exercises/${exerciseId}` as Href;
}

export function newExerciseHref(): Href {
  return '/exercises/new' as Href;
}

export function newVariantHref(exerciseId: string): Href {
  return `/exercises/${exerciseId}/variant-new` as Href;
}
