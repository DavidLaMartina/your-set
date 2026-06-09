# Your Set — Implementation Plan

Phased delivery in small, reviewable PRs. Each phase has clear exit criteria before moving on.

**Master plan (living):** [.cursor/plans/your-set-mvp.md](../.cursor/plans/your-set-mvp.md)

> **Schema v5 update (2026-06-06):** the `exercise`/`variant` split below was collapsed — the **exercise is now the single loggable unit** (with implement/muscle FKs + a secondary-muscle join table). Treat references to `ExerciseVariant`, `exerciseVariantId`, `/variant/[id]/history`, and `/picker/variant` in earlier phases as historical; current shapes live in [data-model.md](./data-model.md), `types/domain.ts`, and `lib/db/migrations/005-exercises-flatten.ts`.
>
> **Schema v6 update (2026-06-07):** manufacturer (equipment brand) moved from the exercise to the **set** (`sets.manufacturer_id`, nullable FK → `manufacturers`); `exercises.manufacturer_id` was removed. Recorded per set at log time. Migration `006` swaps tables with DROP+rename (parent renames would rewrite child FKs to `*_old`) and ships a startup repair for any DB left pointing at `exercises_old` / `sets_old`. References below to "manufacturer on exercise" are historical.

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
  _layout.tsx
  (tabs)/
    sessions.tsx              # Session list
    exercises.tsx             # By recent performed_at
  session/[id].tsx            # Session detail / log (Phase 3)
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

## Phase 2.5 — Tab IA (Sessions vs Exercises)

**Goal:** Match navigation to session-first vs exercise-first mental model.

### Tasks

1. `/(tabs)/sessions` — `listSessions()`; open sessions first; **Start session**
2. `/session/[id]` — session detail (blocks, sets); **End session** → `ended_at`
3. `/(tabs)/exercises` — `loadExercisesByRecency()`; variants with last `performed_at`
4. Remove `/(tabs)/workout` and `/(tabs)/library` tab roots
5. Update [product-spec.md](./product-spec.md) and [.cursor/plans/your-set-mvp.md](../.cursor/plans/your-set-mvp.md)

### Acceptance

- [ ] Sessions tab lists visits; tap opens that session’s sets
- [ ] Exercises tab sorted by recent performance, not alphabetical catalog only
- [ ] + Exercise still works from Exercises tab

---

## Phase 3a — Session definitions & rotation

**Goal:** Model repeatable session definitions (Push A), unlimited instances, active vs retired rotation.

See [data-model.md](./data-model.md) — `sessions` + `session_instances` + `session_exercises`.

### Tasks

1. Migration `002-sessions.ts` (runtime + data backfill for legacy `workouts.name`)
2. Definition CRUD; list `active` / `retired`
3. Start visit from definition (clone planned blocks) vs ad-hoc
4. Sessions tab: Rotation | Recent visits | Retired
5. `/sessions/[id]` — rename, retire, view planned prescriptions
6. Update seed

### Acceptance

- [x] Two visits of same definition share `session_id`
- [x] Retired definition hidden from rotation start; visits still in Recent
- [x] Rename definition; visits show definition name via FK
- [ ] Edit planned lineup in UI (deferred — read-only list in 3a)

---

## Phase 3b — Logging (workouts, session lineup, set-only, Sets tab)

**Goal:** Full set-centric logging — inside a workout, on a session definition, or with no workout at all.

**Data already supports this:** `sets.session_instance_id` nullable; `session_exercises` for definition lineup; clone to `session_instance_exercises` on workout start (3a).

### A — Session definition lineup (`session_exercises`)

Users must be able to **add exercises (variants) to a session** so every workout started from that session gets the same planned blocks.

1. `/sessions/[id]` — add variant from library picker; remove; reorder (`sort_order`)
2. Optional default prescription per planned row (targets from schema)
3. Copy-on-start behavior stays as today when user taps **Start workout** on Workouts tab

### B — Log inside an open workout (`/session/[id]`)

1. **+ Set** on each instance block — create row with `session_instance_id` + `session_instance_exercise_id`, `performed_at` = now
2. Form: weight × reps, date/time, manufacturer (machine / Smith), notes
3. **+ Exercise to workout** — add `session_instance_exercise` (ad-hoc block) then log sets
4. Edit / delete set (delete optional if swipe exists elsewhere)

### C — Set-only logging (no workout)

Two entry points (same underlying insert: `session_instance_id` null):

| Entry | Route | UX |
|-------|-------|-----|
| **Variant** | `/variant/[id]/history` | Prominent **+ Log set** above recent/best sections |
| **Sets tab** | `/(tabs)/sets` (new 4th tab) | All sets `ORDER BY performed_at DESC`; row shows variant, load×reps, time, session label if any |

Sets tab is a **chronological logbook**, not a video feed — optional video badge only; no grid/Instagram layout in 3b.

### D — Navigation

1. Add `app/(tabs)/sets.tsx` + tab bar entry (4 tabs: Sessions, Workouts, Exercises, Sets)
2. `lib/navigation.ts` — `setsTabHref()`

### Acceptance

- [ ] Push A lineup editable; new workout inherits planned variants
- [ ] Open workout: log and edit sets on blocks
- [ ] Log set from variant history without starting a workout
- [ ] Sets tab lists recent sets globally; tap opens set detail
- [ ] `endedAt` on instance still optional

---

## Phase 4 — Local video references

**Goal:** Attach, play, relink, and handle missing videos.

### Dependencies (installed 2026-06-07)

```bash
npx expo install expo-image-picker expo-media-library expo-video expo-video-thumbnails
```

`app.json`: `expo-video` config plugin (auto), plus `expo-image-picker` and `expo-media-library` plugins with iOS photo-library permission strings; camera/microphone/save disabled (read + pick only).

### Storage model

`set_videos` (schema v1, one row per set via `set_id UNIQUE`) holds a **reference**, never a copy:

- `asset_id` — MediaLibrary asset id (lets us re-resolve and detect deletion)
- `uri` / `thumbnail_uri` — last known playable URI + best-effort thumbnail
- `availability_status` — `available` | `missing` | `permissionDenied` | `unknown` (persisted; lists read this, set detail refreshes it)

### Tasks

1. `SetVideoRepository` — `getBySetId`, `upsert` (insert or replace on `set_id`), `updateAvailability`, `deleteBySetId`, `listBySetIds` (batch for list badges)
2. `lib/media/picker.ts` — request library permission, `launchImageLibraryAsync({ mediaTypes: ['videos'] })`, return `{ assetId, uri, durationMs, width, height }`
3. `lib/media/availability.ts` — resolve `assetId` → fresh `localUri` via `getAssetInfoAsync`; map to status (`permissionDenied` when not granted, `missing` when asset gone)
4. `features/video/services/set-video-service.ts` — attach (pick → thumbnail → upsert), relink, remove, `resolveAndPersist`
5. Wire `SetWithVideo` loaders (history, recent sets, session view) to hydrate the stored video instead of `null`
6. Set Detail: `expo-video` playback when available; `MissingVideo` relink/remove wired; attach CTA when none; re-resolve on mount
7. Compare: play both panes when available
8. Thumbnail generation best-effort (`expo-video-thumbnails`); fallback to icon
9. **Orientation-aware playback:** `SetVideoPlayer` measures the upright thumbnail (the encoded track size is landscape for rotated portrait clips) to get the true aspect ratio, measures its container width, and sizes the view so landscape fills width and portrait is height-capped + centered — never a fixed box with side/top bars
10. **Video in the log flow + unified set screen:** `SetVideoSection` is shared across create/edit/view. `attachVideoToSet` is split into `pickVideoFromLibrary` + `persistPickedVideo(setId, picked)` so the create screen (`/set/log`) can stage a picked video and persist it after `createLoggedSet`. Set detail and edit are one screen (`/set/[id]`, view↔edit toggle, `?edit=1` deep-link); `/set/log` is create-only

> **Storage note (revised):** rather than streaming a photo-library reference, attach **copies** the picked video into the document directory (`set-videos/`) via `expo-file-system` `File`/`Directory`, because the picker's cache URI does not survive reloads. `availability_status` is driven by whether that persisted file exists, with `assetId` re-resolution as a fallback.

### Acceptance

- [ ] Attach video to set; playback works in app
- [ ] Delete video from Photos → app shows missing state, no crash
- [ ] Relink restores `available` when user picks new asset
- [ ] List badges reflect stored status without prompting for permission on every render

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
