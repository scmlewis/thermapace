# Premium UX Polish — Design Spec

**Date:** 2026-07-03
**App:** ThermaPace VDOT
**Direction:** Sports tech polish (Garmin/Strava/Stryd feel)
**Method:** CSS transitions only — zero new dependencies

---

## Goal

Transform the app from functional to premium through targeted micro-interactions and motion. The app should feel responsive, data-driven, and confident — like a professional athletic tool.

---

## Scope

5 areas of polish, ordered by visual impact:

### 1. Tab Transitions

**Current:** Instant show/hide via `hidden` class. Jarring when switching tabs.

**Target:** Crossfade with subtle upward slide.

**Implementation:**
- CSS `@keyframes tabEnter`: `opacity: 0 → 1`, `translateY(8px → 0)`
- Duration: 200ms, ease-out
- Apply via `.tab-active` class added on switch
- Remove `hidden` class, use `display: none` toggled before animation starts
- Outgoing tab: no exit animation (keeps it snappy)

**Files:** `index.html` (CSS + `switchTab()` JS)

---

### 2. Card & Panel Depth

**Current:** Flat cards with static borders. No hover feedback.

**Target:** Subtle lift and glow on hover. Staggered entrance on load.

**Implementation:**
- Hover: `transform: translateY(-2px)`, `box-shadow` enhancement, border brightens to `slate-700/50`
- CSS transition: `200ms ease-out` on `transform`, `box-shadow`, `border-color`
- Page load: cards get `opacity: 0` → `opacity: 1` with staggered `animation-delay` (50ms increments per card)
- Apply to: all `.bg-brand-panel` cards, advisory panels, split calculator cards

**Files:** `index.html` (CSS)

---

### 3. Data Update Feedback

**Current:** VDOT score, level badge, and multiplier snap to new values. No sense of computation.

**Target:** Animated count-up on VDOT, fade-swap on badges, pulse on multiplier.

**Implementation:**
- **VDOT score:** JS `requestAnimationFrame` count-up over 300ms from old value to new value. Interpolate digits.
- **Runner level badge:** CSS `opacity: 0 → 1` transition on text change (trigger via class toggle)
- **Multiplier badge:** CSS `@keyframes pulse-glow`: brief `box-shadow` bloom + scale(1.05 → 1) over 400ms, triggered on recalculation
- **WIV value + dew point:** number count-up (simpler, 200ms)

**Files:** `index.html` (JS `recalculate()` + CSS)

---

### 4. Micro-interactions

**Current:** Buttons and toggles have basic hover states. No press feedback.

**Target:** Tactile press feel, smooth toggle slides, focus rings.

**Implementation:**
- **Buttons:** `:active { transform: scale(0.97) }` with 100ms transition
- **Tab nav buttons:** scale(0.97) on press, background color transition on active swap
- **Weather model toggle (already removed — skip)**
- **View mode / Unit toggles:** thumb slides with `transform: translateX` + shadow, 150ms ease
- **Slider thumbs:** `box-shadow` glow on `:focus` and `:active` (brand accent color)
- **Weather preset buttons:** brief background flash (`brand-accent/20` → transparent) on click
- **Copy button:** checkmark swap with scale bounce on success

**Files:** `index.html` (CSS)

---

### 5. Computation Cue

**Current:** No visual feedback that recalculation happened.

**Target:** Brief pulse on the VDOT circle during computation.

**Implementation:**
- CSS `@keyframes compute-pulse`: `scale(1 → 1.03 → 1)` + `opacity(1 → 0.7 → 1)` over 150ms
- Triggered at start of `recalculate()`, removed on completion
- Applied to the VDOT score circle container

**Files:** `index.html` (JS `recalculate()` + CSS)

---

## What is NOT included

- **Page-load entrance animations** — would feel slow on repeat visits
- **Scroll-triggered animations** — distracting in a data tool
- **Particle effects / flashy overlays** — tacky, not sports tech
- **Page transitions** — single-page app, no route changes
- **Skeleton loaders** — data computes in <50ms, loader would be slower

---

## Technical Constraints

- CSS only for all animations (no JS animation libraries)
- All transitions must respect `prefers-reduced-motion: reduce`
- No layout thrashing — use `transform` and `opacity` only (GPU-composited)
- Total CSS additions: ~80-120 lines
- Total JS additions: ~40-60 lines (count-up helper + trigger logic)

---

## Verification

- All animations feel snappy (<400ms total)
- No jank on mobile (test on 3G throttle)
- `prefers-reduced-motion` disables all animations
- No regressions in existing functionality
- Build passes, no new dependencies
