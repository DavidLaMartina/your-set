/**
 * @deprecated Use session-definitions-service or workouts-tab-service.
 * Kept for any stale imports during transition.
 */
export {
  createSessionDefinition,
  loadSessionDefinition,
  reactivateSessionDefinition,
  retireSessionDefinition,
} from '@/features/sessions/services/session-definitions-service';

export {
  startAdHocWorkout as startAdHocSession,
  startSessionFromDefinition,
} from '@/features/sessions/services/workouts-tab-service';
