# Your Set — MVP Plan

> Living plan for the local-first visual training logbook. Update this file as scope and phases change.

**Last updated:** 2026-05-31  
**Status:** Phase 1 complete; set-centric schema + docs ready for Phase 2

## Product summary

**Your Set** is a private, local-first visual logbook for serious lifters. Users log sets, attach videos from the device photo library, and compare performances over time. Not a beginner app, coaching platform, or social product.

**MVP constraints:** Expo RN, TypeScript, Expo Router, SQLite, local video references only. No auth, backend, cloud video, payments, or social.

## Documentation index

| Doc | Purpose |
|-----|---------|
| [docs/product-spec.md](../../docs/product-spec.md) | Positioning, flows, screens, out-of-scope |
| [docs/implementation-plan.md](../../docs/implementation-plan.md) | Phased build order, milestones, acceptance |
| [docs/data-model.md](../../docs/data-model.md) | Entities, fields, SQLite sketch, sync hooks |
| [docs/design-system.md](../../docs/design-system.md) | Tokens, typography, components, gym UX |
| [docs/cursor-rules.md](../../docs/cursor-rules.md) | Agent/dev conventions for this repo |

## Recommended architecture

```
app/                    # Expo Router routes only (thin)
features/               # Domain modules (exercises, workouts, sets, video)
  <domain>/
    components/         # Screen-specific UI
    hooks/
    services/           # Business logic
    types.ts
lib/
  db/                   # SQLite init, migrations, query helpers
  media/                # Photo library refs, availability checks
  theme/                # Design tokens (replaces starter Colors)
components/             # Shared UI primitives (Button, Card, SetRow, …)
constants/              # App-wide non-theme constants
types/                  # Shared domain types (or colocated in features)
```

**Principles**

- UI routes stay thin; persistence and rules live in `features/*/services` and `lib/db`.
- **Set-centric:** every set has `exerciseVariantId` + `performedAt`; `workoutId` optional.
- **Three query modes** — see [docs/data-model.md](../../docs/data-model.md) and `lib/db/queries.ts`.
- **`endedAt` optional** — never required to log or view sets.
- Repositories wrap SQL; services orchestrate transactions and domain rules.
- Video layer stores metadata + `assetId`/`uri`; never copies video files into app storage for MVP.
- IDs: UUID strings from day one (easier future sync than auto-increment).
- Timestamps: ISO 8601 strings in SQLite (`TEXT`).

## Navigation (target)

| Route | Screen |
|-------|--------|
| `/(tabs)/workout` | Active workout (primary tab) |
| `/(tabs)/library` | Exercises / variants manager |
| `/(tabs)/history` | Recent workouts list (optional Phase 2+) |
| `/workout/[id]` | Active or past workout detail |
| `/variant/[id]/history` | Exercise variant history |
| `/set/[id]` | Set detail |
| `/set/[id]/compare` | Video compare |
| `/exercises` | Exercise/variant manager (stack) |

Starter `(tabs)/index` + `explore` will be replaced during Phase 1.

## Implementation phases

### Phase 1 — Foundation & static UI

- [x] Confirm Expo 54 / Router 6 / TS strict (done in repo)
- [x] Replace starter theme with dark-first tokens (`lib/theme`)
- [x] Add `features/` + `lib/` folder scaffold
- [x] Mock data module for realistic lifting data
- [x] Static screens: Active Workout, Variant History, Video Compare (+ Set Detail, Library)
- [x] Shared primitives: `Screen`, `Card`, `SetRow`, `DenseInput`, `VideoBadge`, `MissingVideo`
- [x] Switch `userInterfaceStyle` to `dark` default in `app.json`

**Exit:** Three core screens navigable with mock data; looks like final product tone.

### Phase 2 — SQLite & CRUD

- [x] Schema `lib/db/migrations/001_initial.sql` (set-centric, optional session)
- [x] Query templates `lib/db/queries.ts`, mappers `lib/db/map-row.ts`
- [x] Domain types + `SetListFilters` in `types/domain.ts`
- [ ] Add `expo-sqlite` + `lib/db/client.ts` migration runner
- [ ] Repositories: Exercise, ExerciseVariant, Set (three query modes), Workout, WorkoutExercise
- [ ] Exercise/Variant Manager wired to DB

**Exit:** Sets persist with `performedAt`; sets without `workoutId` query correctly; variants CRUD works.

### Phase 3 — Logging (session + set-only)

- [ ] Set-only log path (`workoutId` null)
- [ ] Optional session: start workout, add blocks, log sets with session link
- [ ] Optional **End** → `endedAt` only
- [ ] Fast set entry; RIR, set type, failure, notes
- [ ] Variant history + Active Workout from DB (`performed_at` ordering)

**Exit:** Session users and set-only users both supported; no video yet.

### Phase 4 — Local video references

- [ ] `expo-media-library` + `expo-image-picker` (permissions in `app.json`)
- [ ] SetVideo repository + availability checker
- [ ] Attach / relink / remove video on set
- [ ] Thumbnails via `expo-video-thumbnails` if stable on target SDK
- [ ] Missing video UI component + Set Detail integration

**Exit:** Videos attach from library; deleted library assets show graceful missing state.

### Phase 5 — History & compare

- [ ] Variant history queries (recent, best, comparable filters)
- [ ] Comparable-set heuristic (same variant, similar load/reps band)
- [ ] Video Compare screen with side-by-side playback (`expo-video`)
- [ ] Pick alternate comparison target

**Exit:** User can review progression and compare two set videos.

### Phase 6 — Polish

- [ ] Physical iPhone pass (one-handed, glare, tap targets)
- [ ] Error boundaries / empty states
- [ ] Optional: JSON export of local DB
- [ ] Remove starter template code
- [ ] Update README for Your Set

**Exit:** MVP shippable to TestFlight-internal testing.

## First implementation task (when coding starts)

**Phase 1, Step 1:** Add `lib/theme/tokens.ts` and refactor root layout to force dark theme; add `features/mock-data` and route `app/(tabs)/workout.tsx` with static Active Workout UI using shared `SetRow` / `Card` components.

## Dependency changes (before Phase 2+)

| Package | Phase | Notes |
|---------|-------|-------|
| `expo-sqlite` | 2 | Local persistence |
| `expo-media-library` | 4 | Asset IDs, permissions |
| `expo-image-picker` | 4 | Pick/record video |
| `expo-video` | 4–5 | Playback |
| `expo-video-thumbnails` | 4 | Optional thumbnails |
| `uuid` or `expo-crypto` | 2 | Client-generated IDs |

Do **not** add yet: Clerk, Prisma, Sentry, PostHog, RevenueCat, any HTTP client for backend.

## Future architecture (do not build now)

- Postgres + Fastify/NestJS API
- Clerk auth, S3 presigned uploads, CloudFront
- Optional paid cloud archive (RevenueCat)
- Coach portal (Next.js)
- Sync: last-write-wins or CRDT for log text; videos stay optional cloud

Keep repository interfaces narrow so a `RemoteWorkoutRepository` can sit beside `LocalWorkoutRepository` later.

## Open decisions

- [ ] Tab bar: Workout + Library only vs. add History tab in MVP
- [ ] Weight unit: lb vs kg vs per-profile (default lb for US gym?)
- [ ] Rest timer: out of scope unless requested
- [ ] Web target: deprioritize; iOS-first MVP

## Changelog

| Date | Change |
|------|--------|
| 2026-05-31 | Initial plan and docs created from product prompt |
| 2026-05-31 | Phase 1: dark theme, mock data, Workout/Library tabs, history/compare/set detail screens |
| 2026-05-31 | Set-centric data model: `performedAt`, optional `workoutId`, SQL migration + mock orphan set |
