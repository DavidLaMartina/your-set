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
| Exercises | Create/manage exercises and variants |
| Workouts | Start, log sets, end session |
| Sets | Weight, reps, RIR, set type, failure, notes |
| History | Per-variant history, comparable sets, filters |
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

## Core domain concept: ExerciseVariant

**Exercise** = broad movement category (e.g. Incline Press, Row).  
**ExerciseVariant** = specific setup (equipment, angle, machine brand, grip).

Serious lifters compare **like-with-like** performances. Variants are first-class, not tags on a generic exercise.

## Data access (two lenses, one storage)

The **set** is the atomic record; every set has **`performedAt`** (when it was done). **Sessions are optional.**

| Lens | User question | Example |
|------|---------------|---------|
| **Set-first** | All sets for this variant (or exercise), filter by date/load/reps | Variant history, compare, progression |
| **Session-first** | Everything I did in this gym visit | Active workout, session review |
| **Both** | Sets for this variant *in* this session | Block view inside a session |

Users may only ever log sets (no session). Users may use sessions and optionally tap **End** (`endedAt` — never required).

## User flows (MVP)

1. **Manage library** — Create exercise → add variants (equipment, muscle group, setup notes).
2. **Log a set** — Always: variant + `performedAt` + weight/reps/etc. Optionally attach to a session.
3. **Start workout (optional)** — Name optional, bodyweight optional; groups sets under `workoutId`.
4. **Build session (optional)** — Add exercise variants to workout; order blocks.
5. **Log sets in session** — Same as (2), with `workoutId` / block link.
6. **End session (optional)** — Sets `endedAt`; does not affect existing sets.
7. **Attach video** — Pick from library (or record if supported); store reference only.
8. **Review variant** — Set-first history by `performedAt`; filter by load/reps/date/type; includes sets with no session.
9. **Set detail** — `performedAt`, optional session, video status, play or missing state, relink/remove.
10. **Compare** — Side-by-side playback vs another set (by `performedAt`, not session).
11. **Missing video** — Clear copy + relink or remove reference.

## Priority screens

### 1. Active Workout

- Optional session header (name, elapsed, bodyweight) when `workoutId` is set
- **End** — optional; sets `endedAt` only
- Exercise blocks (variant name, notes)
- Dense set rows: weight × reps, set type badge, video icon
- Quick add set, attach video, inline notes
- Optimized for one-handed gym use

### 2. Exercise Variant History

- Variant title + exercise context
- Recent sets timeline
- Best sets (e.g. top weight for rep range)
- Comparable sets section
- Thumbnails / video badges
- Filters: load range, reps, date, set type

### 3. Set Detail

- All set fields
- Video: thumbnail, play, or missing component
- Actions: relink, remove reference, open compare

### 4. Video Compare

- Two-up video layout
- Metadata under each (weight, reps, date, set type, angle)
- Notes
- Change comparison target

### 5. Exercise / Variant Manager

- List exercises → drill into variants
- CRUD with equipment, muscle group, setup notes

### 6. Missing Video state

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

- User can complete a full workout session offline with multiple variants and sets
- User can attach a video to a set and play it back from library reference
- Deleting the video from Photos shows missing state, not a crash
- User can open variant history and compare two sets with video side-by-side
- App feels fast and serious on a physical iPhone in a gym environment
