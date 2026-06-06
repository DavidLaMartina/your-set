# Your Set — Design System

Dark mode first. Premium utilitarian—dense information, large tap targets, minimal typing. Built for the gym floor, not the marketing site.

## Brand feel

| Aim for | Avoid |
|---------|--------|
| Training notebook | Cute illustrations |
| Film room / scouting | Gamified badges |
| Performance archive | Wellness pastel gradients |
| Serious tool | Motivational copy |

## Color tokens (target)

Replace starter `constants/theme.ts` colors during Phase 1 with `lib/theme/tokens.ts`.

### Background & surfaces

| Token | Hex (approx) | Usage |
|-------|----------------|-------|
| `bg.base` | `#0A0A0B` | Screen background |
| `bg.elevated` | `#141416` | Cards, blocks |
| `bg.subtle` | `#1C1C1F` | Nested rows, inputs |
| `bg.overlay` | `rgba(0,0,0,0.72)` | Modals |

### Text

| Token | Hex | Usage |
|-------|-----|-------|
| `text.primary` | `#F2F2F3` | Headings, primary values |
| `text.secondary` | `#A1A1A6` | Labels, metadata |
| `text.muted` | `#6B6B70` | Hints, disabled |
| `text.inverse` | `#0A0A0B` | On accent buttons |

### Accent (restrained)

| Token | Hex | Usage |
|-------|-----|-------|
| `accent.primary` | `#C9A227` | Gold/bronze—PR highlights, active tab (optional) |
| `accent.secondary` | `#3B82F6` | Links, compare mode indicator (sparingly) |
| `accent.danger` | `#E5484D` | Destructive actions |

Prefer monochrome + one accent. No rainbow muscle-group colors in MVP.

### Borders & dividers

| Token | Value |
|-------|-------|
| `border.default` | `#2A2A2E` |
| `border.focus` | `#C9A227` |

## Typography

System fonts (SF Pro on iOS). No custom font files in MVP.

| Style | Size | Weight | Use |
|-------|------|--------|-----|
| `title.large` | 22 | 600 | Screen titles |
| `title.medium` | 18 | 600 | Block headers (variant name) |
| `body` | 16 | 400 | Notes, descriptions |
| `label` | 13 | 500 | Field labels |
| `caption` | 12 | 400 | Timestamps, RIR |
| `data.large` | 20 | 600 | Weight × reps in set rows |
| `data.mono` | 15 | 500 | Tabular numbers (tabular lining if available) |

## Spacing scale

4pt base: `4, 8, 12, 16, 20, 24, 32`

- Screen horizontal padding: `16`
- Card padding: `12`
- Set row height: min `48` tap target, prefer `52`
- Gap between set rows: `4`–`8`

## Radius

| Token | Value |
|-------|-------|
| `radius.sm` | 6 |
| `radius.md` | 10 |
| `radius.lg` | 14 |

Cards and inputs use `md`; thumbnails `sm`.

## Elevation

Minimal shadows on dark UI. Use `bg.elevated` + `border.default` instead of heavy shadow.

## Core components (build in Phase 1)

### Layout

- **Screen** — Safe area, `bg.base`, optional header slot
- **StackHeader** — Back, title, right action

### Data display

- **Card** — Elevated surface for exercise blocks
- **SetRow** — Weight/reps inputs, set index, type badge, video affordance
- **SetTypeBadge** — Compact chip for `top_set`, `backoff`, etc.
- **VideoBadge** — Thumbnail or icon; states: none, attached, missing
- **MetadataRow** — Label + value pairs on Set Detail

### Input

- **DenseInput** — Numeric keyboard for weight/reps
- **Stepper** — ±2.5 / ±5 lb plate jumps (config later)
- **PickerSheet** — Set type, camera angle (bottom sheet)

### Feedback

- **EmptyState** — Variant history with no sets
- **MissingVideo** — Spec copy from product spec; Relink / Remove actions

### Video

- **VideoThumbnail** — 16:9, `radius.sm`, play overlay
- **ComparePane** — Half-width video + metadata stack

## Iconography

Use `@expo/vector-icons` (Ionicons) or `expo-symbols` SF Symbols on iOS. Outline style, 22–24pt in rows, 28pt in tabs.

Suggested mappings:

- Video attached: `videocam`
- Video missing: `videocam-off` / `alert-circle`
- Compare: `git-compare` or `swap-horizontal`
- Add set: `add-circle-outline`

## Motion

Subtle only: 150–200ms opacity/scale on press. No celebratory animations. Haptics optional on set complete (`expo-haptics` light impact).

## Gym UX rules

1. **One-handed** — Primary actions in bottom 60% of screen where possible.
2. **Minimal typing** — Numeric pads; notes behind expand.
3. **Density** — Show weight × reps + set # without scrolling per set.
4. **Contrast** — Readable under gym lighting; test outdoors if possible.
5. **No blocking modals** mid-set except video picker.
6. **Active workout persists** — Resume after background/kill (Phase 3).

## App configuration

- `app.json`: `userInterfaceStyle: "dark"` (change from `automatic` when implementing theme)
- Splash: dark graphite background aligned with `bg.base`
- Status bar: `light` content

## Accessibility (MVP baseline)

- Minimum 44×44pt touch targets
- `accessibilityLabel` on icon-only buttons
- Support Dynamic Type where low-cost (allow text scaling on notes, not on dense set grid initially)

## Reference screens (wireframe intent)

### Active Workout

```
[ Session · 47m · 185 lb ]          [ End ]
┌─ Smith high incline ────────────────┐
│ Set 1  185 × 8    [top]  [📹]      │
│ Set 2  175 × 10   [back] [📹+]     │
│ [ + Set ]                          │
└────────────────────────────────────┘
[ + Exercise ]
```

### Video Compare

```
┌─────────────┬─────────────┐
│  Today      │  2025-03-12 │
│  [ video ]  │  [ video ]  │
│ 185×8 top   │ 180×8 top   │
└─────────────┴─────────────┘
[ Change comparison ]
```

Implementation uses flex layout, not literal ASCII—this documents density intent.
