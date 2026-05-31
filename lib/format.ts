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

export function formatWorkoutElapsed(startedAtIso: string): string {
  const ms = Date.now() - new Date(startedAtIso).getTime();
  const mins = Math.floor(ms / 60000);
  if (mins < 60) return `${mins}m`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${h}h ${m}m`;
}
