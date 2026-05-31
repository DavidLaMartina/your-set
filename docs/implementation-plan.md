# Your Set — Implementation Plan

Phased delivery in small, reviewable PRs. Each phase has clear exit criteria before moving on.

**Master plan (living):** [.cursor/plans/your-set-mvp.md](../.cursor/plans/your-set-mvp.md)

## Repo baseline (2026-05-31)

| Item | State |
|------|--------|
| Expo SDK | ~54.0.34 |
| React Native | 0.81.5 |
| React | 19.1.0 |
| Expo Router | ~6.0.23 |
| TypeScript | ~5.9.2 strict |
| New Architecture | Enabled |
| React Compiler | Enabled (experiment) |
| Typed routes | Enabled |
| Starter UI | Default tabs (Home, Explore) + modal |
| SQLite / media | Not installed |
| `docs/` | Created with this pass |

Path alias: `@/*` → project root (per `tsconfig.json`).

## Target folder structure

```
app/
  _layout.tsx                 # Root stack, providers, DB init (later)
  (tabs)/
    _layout.tsx
    workout.tsx               # Active workout (primary)
    library.tsx               # Exercises / variants
  workout/[id].tsx            # Optional deep link
  variant/[id]/history.tsx
  set/[id]/index.tsx
  set/[id]/compare.tsx
  exercises/                  # Manager stack screens
    index.tsx
    [exerciseId].tsx

components/                   # Shared UI primitives
  ui/
  missing-video.tsx
  set-row.tsx
  ...

features/
  exercises/
    components/
    services/
    types.ts
  workouts/
  sets/
  video/
  history/

lib/
  db/
    client.ts
    migrations/
    repositories/
  media/
    availability.ts
    picker.ts
  theme/
    tokens.ts
    use-theme.ts

types/
  domain.ts

constants/                    # Non-theme app constants
docs/                         # Product & technical docs
```

Starter files to remove/replace over time: `hello-wave`, `parallax-scroll-view`, `(tabs)/index`, `(tabs)/explore` demo content.

---

## Phase 1 — Foundation & static UI

**Goal:** Prove look, navigation, and gym-density UX with mock data—no database.

### Tasks

1. **Theme**
   - Create `lib/theme/tokens.ts` per [design-system.md](./design-system.md)
   - Add `ThemeProvider` wrapper; default dark
   - Update `app.json` `userInterfaceStyle` to `dark`

2. **Scaffold**
   - Create `features/mock-data/` with realistic lifting fixtures
   - Create `types/domain.ts` mirroring [data-model.md](./data-model.md)

3. **Shared components**
   - `Screen`, `Card`, `SetRow`, `SetTypeBadge`, `VideoBadge`, `DenseInput`

4. **Routes**
   - Replace tab layout: Workout + Library (drop starter Home/Explore)
   - `app/(tabs)/workout.tsx` — Active Workout (mock in-progress session)
   - `app/variant/[id]/history.tsx` — Variant History
   - `app/set/[id]/compare.tsx` — Video Compare (mock two sets)
   - Wire navigation between screens with mock IDs

5. **Static states**
   - Include one missing-video example in mock data

### Acceptance

- [ ] App launches to dark Active Workout mock
- [ ] Can navigate to History and Compare without errors
- [ ] No hardcoded random colors outside tokens
- [ ] Readable on iPhone simulator at a glance

### Estimated size

~15–25 files touched; single focused PR.

---

## Phase 2 — SQLite & CRUD

**Goal:** Persist library + sets using the **set-centric** schema (optional sessions).

### Dependencies

```bash
npx expo install expo-sqlite
npm install uuid
npm install -D @types/uuid
```

(Or use `expo-crypto` `randomUUID` to avoid extra package.)

### Schema (ready)

- [`lib/db/migrations/001_initial.sql`](../lib/db/migrations/001_initial.sql) — `sets.exercise_variant_id`, `sets.performed_at` (required), nullable `workout_id` / `workout_exercise_id`
- [`lib/db/queries.ts`](../lib/db/queries.ts) — three query modes
- [`lib/db/map-row.ts`](../lib/db/map-row.ts) — row ↔ domain mappers

### Tasks

1. `lib/db/client.ts` — open DB, run `001_initial.sql` on startup
2. Repositories:
   - `ExerciseRepository`, `ExerciseVariantRepository`
   - `SetRepository` — `listByVariant(filters)`, `listByExercise(filters)`, `listByWorkout`, `listByWorkoutAndVariant`, `insert` with optional session fields
   - `WorkoutRepository`, `WorkoutExerciseRepository` (session path only)
3. Thin service layer; validate `workoutExerciseId` ⇒ `workoutId` ([`types/set-validation.ts`](../types/set-validation.ts))
4. Wire **Exercise/Variant Manager** to DB
5. Dev seed optional (include one set with `workout_id` NULL)

### Acceptance

- [ ] CRUD exercises and variants survives app restart
- [ ] Insert set **without** `workoutId` — queryable by variant + `performed_at`
- [ ] Insert set **with** `workoutId` — queryable in session and variant views
- [ ] `endedAt` remains null on workouts unless user ends session

---

## Phase 3 — Logging (session + set-only)

**Goal:** Log sets to SQLite from Active Workout **or** set-only path; optional session.

### Tasks

1. **Set-only log** — variant picker → log set with `performedAt` (default now), `workoutId` null
2. **Optional session** — start workout, add blocks, log sets with `workoutId` + `workoutExerciseId`
3. **End session (optional)** — set `endedAt` only; never block set saves
4. Add variant to workout; reorder blocks
5. Editable weight/reps; RIR, set type, failure, notes
6. Replace mock Active Workout / variant history with repository queries
7. Variant history uses `listByVariant` ordered by `performed_at`

### Acceptance

- [ ] User can log a set with no session and see it in variant history
- [ ] User can log sets inside a session; query (3) returns correct subset
- [ ] Session can remain open forever (`endedAt` null)
- [ ] No video features required yet

---

## Phase 4 — Local video references

**Goal:** Attach, play, relink, and handle missing videos.

### Dependencies

```bash
npx expo install expo-media-library expo-image-picker expo-video expo-video-thumbnails
```

Update `app.json` with iOS `NSPhotoLibraryUsageDescription` / Android permissions per Expo docs v54.

### Tasks

1. `SetVideoRepository` + migration if table created in Phase 2
2. `lib/media/picker.ts` — pick video from library
3. `lib/media/availability.ts` — resolve `assetId`, set status
4. Attach flow from SetRow / Set Detail
5. Thumbnail generation (best-effort; fallback to icon)
6. `MissingVideo` component on Set Detail + Compare when unavailable
7. Relink and remove reference actions
8. Foreground refresh of availability statuses

### Acceptance

- [ ] Attach video to set; playback works in app
- [ ] Delete video from Photos → app shows missing state, no crash
- [ ] Relink restores `available` when user picks new asset

---

## Phase 5 — History & compare

**Goal:** Variant progression views and side-by-side video comparison.

### Tasks

1. `features/history/services` — recent, best, comparable queries
2. Variant History screen wired to DB + filters (load, reps, date, set type)
3. Set Detail screen (`app/set/[id]/index.tsx`)
4. Compare screen: `expo-video` two players, synced optional (play each independently OK for MVP)
5. Comparison target picker (list comparable sets with video)
6. Entry points: from Set Detail, from history row long-press or compare button

### Comparable-set heuristic (v1)

- Same `exerciseVariantId`
- Weight within ±5% of target set
- Reps within ±2
- Has video with `availabilityStatus !== 'missing'`
- Sort by date desc, limit 20

### Acceptance

- [ ] History shows real past sets for a variant
- [ ] Compare opens two videos with metadata
- [ ] User can switch comparison target

---

## Phase 6 — Polish & ship-ready

### Tasks

1. Physical iPhone testing pass (one-handed, legibility)
2. Empty states, loading states, error toasts
3. Remove starter template code and unused assets
4. Update root `README.md` for Your Set
5. Optional: export local DB to JSON file via `expo-sharing`
6. Lint + manual regression checklist

### Acceptance

- [ ] No starter “Welcome” screens remain
- [ ] Core flows work offline on device
- [ ] Ready for internal TestFlight build

---

## Testing strategy (MVP)

| Layer | Approach |
|-------|----------|
| Repositories | Unit-test SQL against in-memory SQLite if feasible; else manual |
| Services | Test comparable-set logic with fixture arrays |
| UI | Manual gym scenario scripts per phase |
| Video | Device-only tests for library permissions |

Automated E2E (Detox/Maestro) deferred until flows stabilize.

## PR discipline

- One phase step per PR when possible (e.g. Phase 1 theme + Phase 1 workout screen can split)
- Include screenshot or screen recording in PR for UI changes
- Reference phase checkbox in `.cursor/plans/your-set-mvp.md` when completing work

## Risk register

| Risk | Mitigation |
|------|------------|
| Media library API changes in SDK 54 | Read Expo v54 docs before Phase 4 |
| Large videos performance | Stream via URI; no in-app duplication |
| React Compiler + new patterns | Keep components simple; fix compiler warnings early |
| Web platform | Mark video features iOS-only guards until tested |

## Next action

Start **Phase 1, Task 1**: implement `lib/theme/tokens.ts` and dark `ThemeProvider` in root layout.
