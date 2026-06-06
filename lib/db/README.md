# Local database (`lib/db`)

Set-centric SQLite schema. **Sets do not require a session.** Sessions (`workouts`) are optional grouping.

## Files

| File | Purpose |
|------|---------|
| `migrations/001_initial.sql` | Full schema + indexes |
| `queries.ts` | Canonical SQL for the three query modes |
| `row-types.ts` | Snake_case row types |
| `map-row.ts` | Row ↔ domain mappers for repositories |

## Three query modes

1. **Set-first (exercise)** — `SQL_SETS_BY_EXERCISE`, filter on `performed_at`, weight, reps.
2. **Session-instance-first** — `SQL_SETS_BY_SESSION_INSTANCE` + `SQL_INSTANCE_EXERCISES_BY_INSTANCE`.
3. **Exercise within session instance** — `SQL_SETS_BY_SESSION_INSTANCE_AND_EXERCISE`.

> The exercise is the single loggable unit as of schema v5 (`exercise_variants` removed). See `migrations/005-exercises-flatten.ts`.

## Session rules

- `session_instances.ended_at` is nullable; never required to save sets.
- `sets.session_instance_id` and `sets.session_instance_exercise_id` are nullable.
- `sets.performed_at` is required — canonical date/time for every set.
- `CHECK (session_instance_exercise_id IS NULL OR session_instance_id IS NOT NULL)` on `sets`.

## Phase 2

Install `expo-sqlite`, run migration from `001_initial.sql` on app start, implement repositories using `queries.ts` and `map-row.ts`.
