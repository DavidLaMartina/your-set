# Your Set — Cursor / Agent Rules

Conventions for AI-assisted development in this repository. Prefer adding durable rules to this file or `.cursor/rules/` as the project grows.

## Required reading before coding

1. [AGENTS.md](../AGENTS.md) — **Expo SDK 54**: use https://docs.expo.dev/versions/v54.0.0/ only; do not rely on outdated patterns.
2. [docs/product-spec.md](./product-spec.md) — scope and anti-goals
3. [.cursor/plans/your-set-mvp.md](../.cursor/plans/your-set-mvp.md) — current phase and checkboxes
4. [docs/implementation-plan.md](./implementation-plan.md) — task order for active phase

## Product guardrails

**Never add in MVP unless explicitly requested:**

- Backend, API routes, fetch to remote services
- Auth (Clerk, Firebase Auth, etc.)
- Cloud video upload/storage
- Subscriptions (RevenueCat)
- Social feeds, sharing, leaderboards
- AI workout generation, program templates, beginner coaching
- Nutrition, wellness, streaks, badges
- Ads

**Always preserve:**

- Local-first SQLite as source of truth
- Videos as photo-library references only (metadata in DB)
- **ExerciseVariant** as first-class (not flattened into exercise name)
- **Set-centric storage:** `performedAt` required on every set; `workoutId` optional; use `lib/db/queries.ts` patterns
- **`endedAt` never required** — optional End button only sets `workouts.ended_at`
- Serious, dark, utilitarian UX per [design-system.md](./design-system.md)

## Code conventions

| Rule | Detail |
|------|--------|
| Language | TypeScript only for app code |
| Paths | `@/` imports from project root |
| Components | Small, focused; colocate screen-only components under `features/<domain>/components` |
| Business logic | `features/*/services` + `lib/db/repositories` — not in route files |
| Styling | `lib/theme` tokens only; no inline hex in feature code |
| IDs | UUID strings at creation |
| SQL | `snake_case` columns; map to `camelCase` in TS |
| Enums | Stored as snake_case strings; validated at repository boundary |

## Architecture rules

```
app/           → routing, screen composition, data hooks
features/      → domain UI + services
lib/db/        → SQLite, migrations, repositories
lib/media/     → picker, availability (Phase 4+)
lib/theme/     → tokens, theme hooks
components/    → cross-feature UI primitives
```

Do not import `features/foo` from `features/bar` directly; shared types go in `types/` or `types/domain.ts`.

## Expo / React Native

- Use `npx expo install <pkg>` for Expo-managed dependencies to match SDK 54.
- Check platform: iOS-first; guard unsupported web APIs.
- Prefer Expo modules (`expo-sqlite`, `expo-media-library`, `expo-video`) over unmaintained alternatives.
- New Architecture is on—avoid legacy patterns that conflict with it.

## Phased work

- Complete exit criteria for the current phase before starting the next.
- Update checkboxes in `.cursor/plans/your-set-mvp.md` when finishing plan items.
- Do not implement Phase 4 video APIs during Phase 1 static UI.

## UI copy tone

- Direct, neutral, no hype (“Great job!” banned unless user asks)
- Missing video: use exact message from [product-spec.md](./product-spec.md)
- Prefer “Set”, “Variant”, “Workout” terminology consistently

## Git / PR

- Small, reviewable diffs
- Do not commit secrets (`.env`, credentials)
- Do not commit unless user asks
- Screenshot UI changes when practical

## When unsure

1. Check product spec anti-goals
2. Check master plan phase
3. Ask user rather than adding scope (e.g. rest timer, kg/lb toggle, social share)

## Suggested `.cursor/rules` snippet (optional)

If creating project rules file, include:

```markdown
---
description: Your Set app development
globs: ["**/*.{ts,tsx}"]
---

- Read docs/product-spec.md and .cursor/plans/your-set-mvp.md before features.
- Expo SDK 54 docs only: https://docs.expo.dev/versions/v54.0.0/
- No backend, auth, cloud video, or social in MVP.
- Use lib/theme tokens; domain logic in features/*/services.
```

## Dependency approval

Agent may propose adding packages listed in implementation plan for the active phase. Anything outside that list (navigation libs, state managers, Firebase, etc.) requires user confirmation.
