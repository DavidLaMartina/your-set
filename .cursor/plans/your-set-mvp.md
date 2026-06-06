# Your Set — MVP Plan

> Living plan for the local-first visual training logbook. Update this file as scope and phases change.

**Last updated:** 2026-06-06  
**Status:** Phase 3b implemented locally; exercise model redesigned (v5, flatten variants); Phase 4 next

## Product summary

**Your Set** is a private, local-first visual logbook for serious lifters. Users log sets, attach videos from the device photo library, and compare performances over time.

## Documentation index

| Doc | Purpose |
|-----|---------|
| [docs/product-spec.md](../../docs/product-spec.md) | Positioning, flows, screens |
| [docs/data-model.md](../../docs/data-model.md) | Entities — sessions, instances, prescriptions |
| [docs/implementation-plan.md](../../docs/implementation-plan.md) | Phased build order |

## Navigation (current)

| Route | Screen |
|-------|--------|
| `/(tabs)/sessions` | Edit **definitions** — active / retired, swipe delete |
| `/(tabs)/workouts` | **Instances** — open, start visit, recent, swipe delete |
| `/(tabs)/exercises` | Exercises by recent `performed_at` (flat — no variants) |
| `/(tabs)/sets` | Global recent sets, `performed_at` DESC |
| `/set/log` | Log or edit a set (workout or set-only), keyed on `exerciseId` |
| `/picker/exercise` | Add exercise to session lineup, workout, or log-set |
| `/exercises/new` | Create or edit exercise (implement / muscle / mfr pickers) |
| `/exercises/[id]` | Exercise detail = set history + manage |
| `/session/[id]` | One **workout (instance)** — log, end, delete |
| `/sessions/[id]` | **Definition** — rename, retire, delete, planned lineup |
| `/set/[id]`, `/set/[id]/compare` | Set-first drill-down |

## Session model (schema v2)

| Concept | Table | Example |
|---------|--------|---------|
| **Definition** (rotation slot) | `sessions` | “Push A” — `status` active / retired |
| **Planned lineup** | `session_exercises` | Smith incline: 3×8–12 @ 185 |
| **Instance** (one visit) | `session_instances` | Push A on 2026-05-31, `session_id` → definition |
| **Blocks in visit** | `session_instance_exercises` | Order + block notes for that visit |
| **Sets** | `sets` | `session_instance_id` nullable; `performed_at` canonical |

**Tab split:**

1. **Sessions tab** — CRUD definitions (active + retired), swipe-to-delete  
2. **Workouts tab** — open visits, start from definition, ad-hoc, recent visits, swipe-to-delete  
3. **Exercises tab** — set-first library / recency  
4. **Sets tab (planned)** — all recent sets chronologically (set-first home; not a video feed yet)

**Naming:** `sessions.name`; instances inherit label via `session_id` (ad-hoc visits have no definition).

**Session exercises:** Planned variants live on the **session definition** (`session_exercises`). Starting a workout copies that lineup into the visit (`session_instance_exercises`). Editing the definition lineup is **not built yet** — deferred to 3b.

**Set-centric rules (unchanged):** every set has `performed_at`; instance link optional; `ended_at` on instance never required.

## Implementation phases

### Phase 1 — Foundation & static UI

- [x] Complete

### Phase 2 — SQLite & CRUD

- [x] Complete

### Phase 2.5 — Tab IA (Sessions vs Exercises)

- [x] Sessions list; Exercises by recency; `/session/[id]`; End instance

### Phase 3a — Session definitions & rotation

- [x] Migration `002`: `sessions`, `session_exercises`, `session_instances`, `session_instance_exercises`; sets `session_instance_id`
- [x] Legacy `workouts` / `workout_exercises` migrated; `legacy_name:` → definitions for old seed rows
- [x] Seed: Push A definition + planned exercises + open instance
- [x] Repositories + services (rotation, start visit, ad-hoc, retire/reactivate)
- [x] Sessions tab: Rotation | Recent visits | Retired
- [x] `/sessions/[id]` rename + retire; view planned prescriptions (read-only lineup edit deferred)

**Exit:** Multiple Push A weeks are distinct instances of one definition; rotation shortlist works.

### Phase 3b — Logging (workouts, sessions, set-only, Sets tab)

- [x] Session lineup: add / remove / reorder on `/sessions/[id]`; variant picker
- [x] Workout: **+ Set** per block, **+ Exercise** via picker; `/set/log` form
- [x] Set-only: **+ Log set** on variant history; **Sets** tab (chronological list)
- [x] Edit set from set detail → `/set/log?setId=…`
- [ ] Prescription fields when adding to session lineup (deferred — defaults only from seed)
- [ ] Delete set from UI (optional follow-up)

**Exit:** User can define Push A exercises, run a workout, log ad-hoc sets from variant or Sets tab, without workarounds.

### Exercise model redesign (schema v5)

Collapsed the `exercise`/`variant` split — the **exercise is now the single loggable unit**.

- [x] Migration `005`: drop `exercise_variants`; add `implements` / `muscles` / `manufacturers` (seeded stock) + `exercise_secondary_muscles` join; remap `sets` / session FKs to `exercise_id` (pre-release data reseeded)
- [x] Exercise = name + optional implement FK + primary muscle FK + optional manufacturer + secondary muscles; `origin` / `catalog_id` seam for a future shared/cloud library
- [x] Exercise create/edit form with reference pickers; exercise detail = history + manage; `/picker/exercise`
- [ ] **Later:** bundled stock exercise library + filter by muscle/implement; cloud-hosted shared library + sync

### Phase 4 — Local video references

- [ ] Attach, play, missing video

### Phase 5 — History & compare

- [ ] Filters; video compare playback

### Phase 6 — Polish

- [ ] Device pass, export, README

## Open decisions

- [x] Tabs: Sessions, Workouts, Exercises (Sets tab in 3b)
- [x] Session vs instance naming (`sessions` / `session_instances`)
- [ ] Weight unit: lb vs kg
- [ ] Microcycle label in UI (“This week”) — copy only

## Changelog

| Date | Change |
|------|--------|
| 2026-06-06 | Schema v5: flatten exercise/variant → single `exercises` table with implement/muscle/manufacturer FKs + secondary-muscle join; routes `/picker/exercise`, `/exercises/[id]` history |
| 2026-05-31 | Plan: 3b expanded — session lineup UI, set-only (variant + Sets tab) |
| 2026-05-31 | Phase 3a: definitions, rotation, migration 002, three-tab IA |
| 2026-05-31 | Phase 2.5: Sessions + Exercises tabs |
| 2026-05-31 | Plan: set-centric model, SessionTemplate → `sessions` naming |
