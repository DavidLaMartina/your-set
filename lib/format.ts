export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function formatPerformedAt(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function formatSetLabel(weight: number | null, reps: number | null): string {
  if (weight == null && reps == null) return '—';
  if (weight == null) return `${reps} reps`;
  if (reps == null) return `${weight}`;
  return `${weight} × ${reps}`;
}

/**
 * Workout display label: when the exercise name includes "machine" and a
 * manufacturer is set, drop "machine" and lead with the brand (e.g. Prime
 * incline press). Otherwise return the stored exercise name.
 */
export function formatExerciseDisplayName(
  exerciseName: string,
  manufacturerName: string | null | undefined,
): string {
  if (!manufacturerName?.trim()) return exerciseName;
  if (!/\bmachine\b/i.test(exerciseName)) return exerciseName;
  const withoutMachine = exerciseName.replace(/\bmachine\b/gi, '').replace(/\s+/g, ' ').trim();
  return withoutMachine ? `${manufacturerName} ${withoutMachine}` : manufacturerName;
}

export function formatWorkoutElapsed(startedAtIso: string): string {
  const ms = Date.now() - new Date(startedAtIso).getTime();
  const mins = Math.floor(ms / 60000);
  if (mins < 60) return `${mins}m`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${h}h ${m}m`;
}
