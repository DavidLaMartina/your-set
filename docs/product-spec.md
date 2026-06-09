# Your Set — Product Spec

## Positioning

**Your Set** is a local-first visual training logbook for serious lifters, bodybuilders, and advanced trainees.

> A private visual logbook for serious lifters.  
> Track the set. Watch the progression.  
> Numbers don’t tell the whole story.

### What this app is

- A private log of what you actually did in the gym
- A place to attach set videos and compare form/load over time
- Organized around **exercise variants** (specific setups), not generic “bench press”

### What this app is not

- Beginner fitness / hand-holding
- Workout programming or coaching
- Wellness, habits, or motivation
- Gamified streaks, badges, or social feeds
- AI workout generation
- Nutrition tracking
- Ads or subscriptions (MVP)

## Target user

Someone who already knows how to train. They want fast logging, video attachment, and visual comparison—not education or program delivery.

## MVP scope

### In scope

| Area | MVP behavior |
|------|----------------|
| Persistence | Local SQLite only |
| Auth | None |
| Video | References to photo library / camera roll; metadata in DB |
| Video missing | Graceful state if user deletes asset or permissions change |
| Exercises | Create/manage exercises (implement, muscle); manufacturer per set at log time |
| Workouts | Start, log sets, end session |
| Sets | Weight × reps, editable date/time, manufacturer (machine / Smith), notes |
| History | Per-exercise history, comparable sets, filters |
| Compare | Side-by-side video of current vs prior set |
| Platform | iOS-first; Android secondary; web not a priority |

### Out of scope (MVP)

- Backend, cloud sync, auth
- Cloud video storage or CDN delivery
- Payments / subscriptions
- Social features, sharing feeds
- Coach/client portals
- AI features, program templates, beginner guidance
- Nutrition, body metrics trends (except optional session bodyweight)
- Export (nice-to-have later, not required v1)

## Core domain concept: Exercise

**Exercise** = the specific movement you log against (e.g. "Machine incline press", "Neutral-grip cable row"). It carries an **implement** (barbell, dumbbell, machine, cable, …), a **primary muscle**, and optional **secondary muscles**. **Manufacturer** (equipment brand) is recorded on each **set** when logging — same exercise, different machine that day.

Serious lifters compare **like-with-like**, so setup specifics live on the exercise itself rather than as a separate "variant" layer (the v4 exercise/variant split was collapsed in schema v5). `origin` / `catalogId` are the seam for a future shared/cloud exercise library; user-created exercises live in the same table tagged `custom`.

## Data access (two lenses, one storage)

The **set** is the atomic record; every set has **`performedAt`** (when it was done). **Sessions are optional.**

| Lens | User question | Example |
|------|---------------|---------|
| **Set-first** | All sets for this exercise, filter by date/load/reps | Exercise history, compare, progression |
| **Session-first** | Everything I did in this gym visit | Active workout, session review |
| **Both** | Sets for this exercise *in* this session | Block view inside a session |

Users may only ever log sets (no session). Users may use sessions and optionally tap **End** (`endedAt` — never required).

## User flows (MVP)

1. **Manage library** — Create an exercise (name + implement + primary muscle, optional secondary muscles).
2. **Define session (rotation slot)** — Add planned exercises to a **session definition** (`session_exercises`) so each **workout** started from that session gets the same lineup (Phase 3b UI).
3. **Log a set** — Always: exercise + `performedAt` + weight/reps/etc. **Workout optional** (`session_instance_id` null = set-only).
4. **Start workout (optional)** — From Workouts tab: from session definition (clones lineup) or ad-hoc; bodyweight optional.
5. **Log sets in workout** — Link to instance + block; same fields as (3) (Phase 3b).
6. **Log set without workout** — From **exercise detail** (`+ Log set`) or **Sets tab** (global recent list) (Phase 3b).
7. **End workout (optional)** — Sets `endedAt` on instance; does not affect existing sets.
8. **Attach video** — Pick from library (or record if supported); store reference only.
9. **Review exercise** — Set-first history by `performedAt`; includes sets with no workout.
10. **Sets tab** — Chronological log of all recent sets (not a video grid in MVP).
11. **Set detail** — `performedAt`, optional workout/session label, video status, play or missing state, relink/remove.
12. **Compare** — Side-by-side playback vs another set (by `performedAt`, not session).
13. **Missing video** — Clear copy + relink or remove reference.

## Priority screens

### 1. Sessions tab

**Today:** list of session **instances** (open first, then past); Start creates a new ad-hoc instance; seed name `"Push A"` is a plain string with no edit UI.

**Planned (Phase 3a):**

- **Rotation** — active session **definitions** (e.g. Push A); start a new **instance** each time
- **Recent instances** — Push A this week, Push A next week, etc. as separate visits
- **Retired definitions** — off rotation but history preserved
- Rename template; retire/reactivate slot

### 2. Session detail (stack)

- Session header (name, elapsed or ended, bodyweight)
- **End** — optional; sets `endedAt` only
- Exercise blocks with sets (read-only until Phase 3 logging)
- Optimized for one-handed gym use when logging (Phase 3)

### 3. Exercises tab

- Exercises sorted by most recently performed (`performedAt`)
- Each row shows implement · primary muscle + last performed time
- Tap exercise → exercise detail (history + manage)

### 4. Exercise Detail / History

- Exercise name + implement · muscle context; per-set manufacturer on history rows when set
- Prominent **+ Log set**
- Recent sets timeline
- Best sets (e.g. top weight for rep range)
- Comparable sets section
- Thumbnails / video badges
- Filters: load range, reps, date, set type

### 5. Set Detail

- All set fields
- Video: thumbnail, play, or missing component
- Actions: relink, remove reference, open compare

### 6. Video Compare

- Two-up video layout
- Metadata under each (weight, reps, date, set type, angle)
- Notes
- Change comparison target

### 7. Exercise Manager (stack)

- Create/edit exercise: name + implement + primary muscle + secondary muscles
- Log/edit set: optional manufacturer (defaults to last used for that exercise)
- Delete exercise (removes its sets)

### 8. Missing Video state

Message:

> Video unavailable. This video may have been deleted from your photo library or your media permissions may have changed.

Actions: **Relink video**, **Remove video reference**.

## Design tone

Dark mode first. Feels like: training notebook, film room, performance archive—not a playful fitness consumer app.

See [design-system.md](./design-system.md).

## Long-term (not MVP)

Documented for architectural alignment only:

- Cloud sync for text/log data
- Optional paid cloud video archive
- Cross-device sync
- Coach/client sharing
- Web/coach portal (Next.js)
- Stack candidates: Node/Fastify or NestJS, Postgres, Prisma/Drizzle, Clerk, S3 + presigned URLs, RevenueCat, Sentry, PostHog

MVP must not block these paths (stable IDs, clear domain boundaries) but must not implement them.

## Success criteria (MVP)

- User can complete a full workout session offline with multiple exercises and sets
- User can attach a video to a set and play it back from library reference
- Deleting the video from Photos shows missing state, not a crash
- User can open exercise history and compare two sets with video side-by-side
- App feels fast and serious on a physical iPhone in a gym environment
