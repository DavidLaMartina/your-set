# Your Set — MVP Plan

> Living plan for the local-first visual training logbook. Update this file as scope and phases change.

**Last updated:** 2026-05-31  
**Status:** Phase 2.5 done locally; Phase 3a (templates + rotation) planned next

## Product summary

**Your Set** is a private, local-first visual logbook for serious lifters. Users log sets, attach videos from the device photo library, and compare performances over time.

## Documentation index

| Doc | Purpose |
|-----|---------|
| [docs/product-spec.md](../../docs/product-spec.md) | Positioning, flows, screens |
| [docs/data-model.md](../../docs/data-model.md) | Entities — includes **SessionTemplate** (planned) |
| [docs/implementation-plan.md](../../docs/implementation-plan.md) | Phased build order |

## Navigation (current)

| Route | Screen |
|-------|--------|
| `/(tabs)/sessions` | Instance list + Start session (ad-hoc instance today) |
| `/(tabs)/exercises` | Exercises by recent `performed_at` |
| `/session/[id]` | One instance — blocks, sets, End |
| `/variant/[id]/history`, `/set/[id]`, … | Set-first drill-down |

## Session model — current vs target

### Today (schema v1)

- **`workouts`** = one row per gym visit (instance).
- **`workouts.name`** optional string — seed uses `"Push A"`; **no UI** to set or edit name.
- **No** link between multiple `"Push A"` rows — they are not instances of one definition.
- **No** active / retired rotation.

### Target (schema v2 — SessionTemplate)

| Concept | Entity | Example |
|---------|--------|---------|
| **Definition** (rotation slot) | `SessionTemplate` | “Push A” — active in microcycle |
| **Instance** (one visit) | `Workout` + `sessionTemplateId` | Push A on 2026-05-31 |
| **Another instance** | New `Workout`, same template id | Push A next week |
| **Retired definition** | `SessionTemplate.status = retired` | Old “Push A” after program change; instances kept |

**Sessions tab (target UX):**

1. **Rotation** — active templates, start new instance per template  
2. **Recent instances** — chronological visits (all templates + ad-hoc)  
3. **Retired** — retired templates; drill into past instances  

**Naming:** edit `SessionTemplate.name`; instances inherit label (optional per-instance notes only).

## Implementation phases

### Phase 1 — Foundation & static UI

- [x] Complete

### Phase 2 — SQLite & CRUD

- [x] Complete

### Phase 2.5 — Tab IA (Sessions vs Exercises)

- [x] Sessions list; Exercises by recency; `/session/[id]`; End session
- [x] **Not in scope:** template/rotation (documented above)

### Phase 3a — Session templates & rotation (next schema work)

- [ ] Migration `002`: `session_templates` table; `workouts.session_template_id` FK
- [ ] Migrate seed: create template “Push A” (active) + instance linked to it
- [ ] Repositories + services for templates (CRUD, list active/retired)
- [ ] **Start session** → pick active template OR ad-hoc; creates **new instance**
- [ ] **Rename template**; **retire / reactivate** template
- [ ] Sessions tab sections: Rotation | Recent instances | Retired
- [ ] Deprecate relying on duplicate `workouts.name` alone

**Exit:** Multiple Push A weeks are distinct instances of one template; rotation shortlist works.

### Phase 3b — Logging (session + set-only)

- [ ] Log sets inside instance; set-only without template
- [ ] Add variant to session block; editable weight/reps, RIR, set type

**Exit:** Full gym logging without workarounds.

### Phase 4 — Local video references

- [ ] Attach, play, missing video

### Phase 5 — History & compare

- [ ] Filters; video compare playback

### Phase 6 — Polish

- [ ] Device pass, export, README

## Open decisions

- [x] Tabs: Sessions + Exercises
- [ ] **Template default exercises** (planned blocks per Push A) — defer post-3a or include in 3a?
- [ ] Weight unit: lb vs kg
- [ ] Microcycle length label in UI (“This week”) — copy only, no calendar sync required for MVP

## Changelog

| Date | Change |
|------|--------|
| 2026-05-31 | Phase 2.5: Sessions + Exercises tabs |
| 2026-05-31 | Plan: SessionTemplate, instances, active/retired rotation (Phase 3a) |
