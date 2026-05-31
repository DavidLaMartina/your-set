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

1. **Set-first / variant-first** — `SQL_SETS_BY_VARIANT` or `SQL_SETS_BY_EXERCISE`, filter on `performed_at`, weight, reps.
2. **Session-first** — `SQL_SETS_BY_WORKOUT` + `SQL_WORKOUT_EXERCISES_BY_WORKOUT`.
3. **Variant within session** — `SQL_SETS_BY_WORKOUT_AND_VARIANT`.

## Session rules

- `workouts.ended_at` is nullable; never required to save sets.
- `sets.workout_id` and `sets.workout_exercise_id` are nullable.
- `sets.performed_at` is required — canonical date/time for every set.
- `CHECK (workout_exercise_id IS NULL OR workout_id IS NOT NULL)` on `sets`.

## Phase 2

Install `expo-sqlite`, run migration from `001_initial.sql` on app start, implement repositories using `queries.ts` and `map-row.ts`.
