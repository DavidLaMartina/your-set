# Your Set — MVP Plan

> Living plan for the local-first visual training logbook. Update this file as scope and phases change.

**Last updated:** 2026-05-31  
**Status:** Phase 3a implemented locally (not committed per git-and-phases rule)

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
| `/(tabs)/exercises` | Exercises by recent `performed_at` |
| `/session/[id]` | One **workout (instance)** — log, end, delete |
| `/sessions/[id]` | **Definition** — rename, retire, delete, planned lineup |
| `/variant/[id]/history`, `/set/[id]`, … | Set-first drill-down |

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

**Naming:** `sessions.name`; instances inherit label via `session_id` (ad-hoc visits have no definition).

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

### Phase 3b — Logging (session + set-only)

- [ ] Log sets inside instance; set-only without instance
- [ ] Add variant to instance block; editable weight/reps, RIR, set type
- [ ] Edit session definition lineup (add/reorder planned exercises)

**Exit:** Full gym logging without workarounds.

### Phase 4 — Local video references

- [ ] Attach, play, missing video

### Phase 5 — History & compare

- [ ] Filters; video compare playback

### Phase 6 — Polish

- [ ] Device pass, export, README

## Open decisions

- [x] Tabs: Sessions + Exercises
- [x] Session vs instance naming (`sessions` / `session_instances`)
- [ ] Weight unit: lb vs kg
- [ ] Microcycle label in UI (“This week”) — copy only

## Changelog

| Date | Change |
|------|--------|
| 2026-05-31 | Phase 3a: definitions, rotation, migration 002 |
| 2026-05-31 | Phase 2.5: Sessions + Exercises tabs |
| 2026-05-31 | Plan: set-centric model, SessionTemplate → `sessions` naming |
