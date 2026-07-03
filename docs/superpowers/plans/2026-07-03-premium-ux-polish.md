# Premium UX Polish — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add sports-tech-grade micro-interactions and motion to ThermaPace VDOT using CSS-only animations.

**Architecture:** All changes are in `index.html` — a single-file vanilla JS app. CSS keyframes and utility classes handle animations. A small JS helper (`animateCountUp`) handles number interpolation. No new dependencies.

**Tech Stack:** CSS @keyframes, CSS transitions, vanilla JS requestAnimationFrame

## Global Constraints

- CSS only for all animations — zero new JS animation libraries
- All transitions must respect `prefers-reduced-motion: reduce`
- No layout thrashing — use `transform` and `opacity` only (GPU-composited)
- No regressions in existing functionality
- Build must pass after each task

---

## File Map

| File | Changes |
|------|---------|
| `index.html` | All CSS additions (new `<style>` block or appended to existing) |
| `index.html` | JS: `animateCountUp()` helper, `switchTab()` modification, `recalculate()` modifications |

---

### Task 1: CSS Foundation — Keyframes & Utility Classes

**Files:**
- Modify: `index.html` (add CSS block before closing `</style>` or in `<head>`)

**What this delivers:** All CSS animation primitives ready to use by later tasks.

- [ ] **Step 1: Add CSS keyframes and utility classes**

Add the following CSS block in the `<style>` section of `index.html` (after existing styles, before `</style>`):

```css
/* === Premium UX Animations === */

/* Tab enter: fade + slide up */
@keyframes tabEnter {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}
.tab-animate-in {
  animation: tabEnter 200ms ease-out forwards;
}

/* Card hover lift */
.card-premium {
  transition: transform 200ms ease-out, box-shadow 200ms ease-out, border-color 200ms ease-out;
}
.card-premium:hover {
  transform: translateY(-2px);
  box-shadow 0 8px 25px -5px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(100, 116, 139, 0.15);
  border-color: rgba(100, 116, 139, 0.3);
}

/* Button press feedback */
.btn-press {
  transition: transform 100ms ease-out;
}
.btn-press:active {
  transform: scale(0.97);
}

/* Pulse glow for multiplier badge */
@keyframes pulseGlow {
  0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(6, 182, 212, 0.4); }
  50% { transform: scale(1.05); box-shadow: 0 0 12px 2px rgba(6, 182, 212, 0.3); }
  100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(6, 182, 212, 0); }
}
.pulse-glow {
  animation: pulseGlow 400ms ease-out;
}

/* Computation cue on VDOT circle */
@keyframes computePulse {
  0% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.03); opacity: 0.7; }
  100% { transform: scale(1); opacity: 1; }
}
.compute-pulse {
  animation: computePulse 150ms ease-out;
}

/* Number value fade-swap */
@keyframes fadeSwap {
  0% { opacity: 0; transform: translateY(4px); }
  100% { opacity: 1; transform: translateY(0); }
}
.fade-swap {
  animation: fadeSwap 200ms ease-out;
}

/* Slider thumb glow */
input[type="range"]:focus::-webkit-slider-thumb {
  box-shadow: 0 0 0 3px rgba(6, 182, 212, 0.3);
}
input[type="range"]:active::-webkit-slider-thumb {
  box-shadow: 0 0 0 4px rgba(6, 182, 212, 0.5);
}
input[type="range"]:focus::-moz-range-thumb {
  box-shadow: 0 0 0 3px rgba(6, 182, 212, 0.3);
}
input[type="range"]:active::-moz-range-thumb {
  box-shadow: 0 0 0 4px rgba(6, 182, 212, 0.5);
}

/* Reduced motion respect */
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

- [ ] **Step 2: Verify build passes**

Run: `npm run build`
Expected: PASS, no errors

- [ ] **Step 3: Commit**

```bash
git add index.html
git commit -m "feat: add CSS animation foundation for premium UX polish"
```

---

### Task 2: Tab Transitions

**Files:**
- Modify: `index.html` — `switchTab()` function (around line 1830)

**What this delivers:** Smooth crossfade with upward slide when switching between Setup/Pacing/Advisory tabs.

**Consumes:** `.tab-animate-in` class from Task 1.

- [ ] **Step 1: Update `switchTab()` to animate tab content**

Replace the current tab visibility logic in `switchTab()`. Find the `tabs.forEach` block and replace with:

```javascript
function switchTab(tabId) {
  state.activeTab = tabId;
  saveState();

  const tabs = ['config', 'paces', 'insights'];
  tabs.forEach((tab) => {
    const contentEl = document.getElementById(`tab-content-${tab}`);
    if (contentEl) {
      if (tab === tabId) {
        contentEl.classList.remove('hidden');
        contentEl.classList.remove('tab-animate-in');
        // Force reflow to restart animation
        void contentEl.offsetWidth;
        contentEl.classList.add('tab-animate-in');
        // Redraw D3 chart when switching to paces tab
        if (tab === 'paces' && lastComputedPaces) {
          setTimeout(() => {
            renderD3PaceShiftChart(lastComputedPaces);
          }, 50);
        }
      } else {
        contentEl.classList.add('hidden');
        contentEl.classList.remove('tab-animate-in');
      }
    }
  });

  // Scroll to top instantly when switching tabs
  if (window.scrollY > 0) {
    window.scrollTo(0, 0);
  }

  // Update active styling of floating bottom nav buttons
  const bottomNavEl = document.getElementById('floating-bottom-nav');
  if (bottomNavEl) {
    bottomNavEl.querySelectorAll('button').forEach((btn) => {
      const btnTab = btn.getAttribute('data-tab');
      if (btnTab === tabId) {
        btn.className = "btn-press flex items-center gap-1.5 py-2 px-4 rounded-full text-[10px] sm:text-xs font-black uppercase tracking-wider bg-brand-accent text-brand-dark transition-all duration-200 cursor-pointer focus:outline-none whitespace-nowrap border-none shadow-lg shadow-brand-accent/20";
      } else {
        btn.className = "btn-press flex items-center gap-1.5 py-2 px-4 rounded-full text-[10px] sm:text-xs font-bold uppercase tracking-wider transition-all duration-200 cursor-pointer focus:outline-none whitespace-nowrap border-none text-slate-400 hover:text-slate-200 bg-transparent";
      }
    });
  }
}
```

- [ ] **Step 2: Verify build passes**

Run: `npm run build`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add index.html
git commit -m "feat: add smooth crossfade tab transitions"
```

---

### Task 3: Card Hover Depth

**Files:**
- Modify: `index.html` — add `.card-premium` class to major card elements

**What this delivers:** Hover lift + glow on all major cards and panels.

**Consumes:** `.card-premium` class from Task 1.

- [ ] **Step 1: Add `card-premium` class to major panels**

Add the `card-premium` class to these elements (find each by its `id` or surrounding HTML):

1. **VDOT Calculator card** — the `<section>` containing Box 1 (Performance Metric)
2. **VDOT Scoring card** — the `<section>` containing Box 3 (VDOT Scoring & Equivalent Performances)
3. **Thermal Engine card** — the `<section>` containing Box 2 (Thermal Engine)
4. **D3 Chart card** — the `<section>` containing Box 3.5 (Thermal Impact: Pace Shift Analysis)
5. **Training Zones card** — the `<section>` containing Box 4 (Target Pace Strategy Grid)
6. **Advisory panel** — the `<section>` with `id="advisory-panel"`
7. **Track Split card** — the `<section>` containing Dynamic Track Split & Target Multiplier

For each, add `card-premium` to the existing class list. Example:

```html
<!-- Before -->
<section class="bg-brand-panel border border-slate-800/80 rounded-xl p-5 sm:p-6 shadow-xl ...">

<!-- After -->
<section class="card-premium bg-brand-panel border border-slate-800/80 rounded-xl p-5 sm:p-6 shadow-xl ...">
```

- [ ] **Step 2: Add `btn-press` class to all interactive buttons**

Add `btn-press` to these buttons:
- All floating bottom nav buttons (already handled in Task 2's `switchTab`)
- Weather preset buttons (the 4 preset `<button>` elements)
- GPS sync button (`id="weather-gps-btn"`)
- Weather search button (`id="weather-search-btn"`)
- Copy clipboard button (`id="copy-clipboard-btn"`)
- View mode toggle buttons (Pace / Speed)
- Unit toggle buttons (Metric / Imperial)

- [ ] **Step 3: Verify build passes**

Run: `npm run build`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add index.html
git commit -m "feat: add card hover depth and button press feedback"
```

---

### Task 4: Animated Number Count-Up

**Files:**
- Modify: `index.html` — add JS helper + wire into `recalculate()`

**What this delivers:** VDOT score, WIV value, and dew point animate smoothly between values instead of snapping.

**Consumes:** `.fade-swap` class from Task 1.

- [ ] **Step 1: Add `animateCountUp` helper function**

Add this function after the existing formatting helpers (after `durationToFormattedTime`):

```javascript
// Animated number count-up helper
function animateCountUp(element, targetValue, duration, decimals) {
  if (!element) return;
  const startValue = parseFloat(element.textContent) || 0;
  const startTime = performance.now();

  function update(currentTime) {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    // Ease-out cubic
    const eased = 1 - Math.pow(1 - progress, 3);
    const current = startValue + (targetValue - startValue) * eased;
    element.textContent = current.toFixed(decimals);
    if (progress < 1) {
      requestAnimationFrame(update);
    }
  }
  requestAnimationFrame(update);
}
```

- [ ] **Step 2: Wire into `recalculate()` — VDOT score**

In `recalculate()`, find where the VDOT score is set:
```javascript
document.getElementById('vdot-score').textContent = vdotDisplayVal;
```

Replace with:
```javascript
const vdotEl = document.getElementById('vdot-score');
animateCountUp(vdotEl, vdot, 300, vdot % 1 === 0 ? 0 : 1);
```

- [ ] **Step 3: Wire into `recalculate()` — WIV value**

Find where `wiv-val` is set:
```javascript
document.getElementById('wiv-val').textContent = wiv.toFixed(1);
```

Replace with:
```javascript
animateCountUp(document.getElementById('wiv-val'), wiv, 200, 1);
```

- [ ] **Step 4: Wire into `recalculate()` — dew point**

Find where `dew-point-val` is set. This one has both Celsius and Fahrenheit. Replace the line:
```javascript
document.getElementById('dew-point-val').textContent = `${t_dp.toFixed(1)}°C / ${(t_dp * 1.8 + 32).toFixed(1)}°F`;
```

With:
```javascript
const dewEl = document.getElementById('dew-point-val');
const dewStart = parseFloat(dewEl.textContent) || 0;
const dewTarget = t_dp;
const dewDuration = 200;
const dewStartTime = performance.now();
function updateDew(now) {
  const elapsed = now - dewStartTime;
  const progress = Math.min(elapsed / dewDuration, 1);
  const eased = 1 - Math.pow(1 - progress, 3);
  const current = dewStart + (dewTarget - dewStart) * eased;
  dewEl.textContent = `${current.toFixed(1)}°C / ${(current * 1.8 + 32).toFixed(1)}°F`;
  if (progress < 1) requestAnimationFrame(updateDew);
}
requestAnimationFrame(updateDew);
```

- [ ] **Step 5: Add `fade-swap` to runner level badge**

Find where the runner level text is set:
```javascript
runnerLevelEl.textContent = level.name;
```

After that line, add:
```javascript
runnerLevelEl.classList.remove('fade-swap');
void runnerLevelEl.offsetWidth;
runnerLevelEl.classList.add('fade-swap');
```

- [ ] **Step 6: Add `pulse-glow` to multiplier badge**

Find where the multiplier badge is set:
```javascript
document.getElementById('current-multiplier-badge').textContent = `x${m_pace.toFixed(3)} Penalty`;
```

After that line, add:
```javascript
const badgeEl = document.getElementById('current-multiplier-badge');
badgeEl.classList.remove('pulse-glow');
void badgeEl.offsetWidth;
badgeEl.classList.add('pulse-glow');
```

- [ ] **Step 7: Verify build passes**

Run: `npm run build`
Expected: PASS

- [ ] **Step 8: Commit**

```bash
git add index.html
git commit -m "feat: add animated number count-up for VDOT, WIV, dew point"
```

---

### Task 5: Computation Cue + Polish

**Files:**
- Modify: `index.html` — `recalculate()` function

**What this delivers:** Visual pulse on the VDOT circle when recalculation runs. Final polish pass.

**Consumes:** `.compute-pulse` class from Task 1.

- [ ] **Step 1: Add computation pulse to VDOT circle**

At the **start** of `recalculate()`, add:
```javascript
// Computation cue
const vdotCircle = document.querySelector('.bg-brand-accent\\/10'); // VDOT score circle container
if (vdotCircle) {
  vdotCircle.classList.remove('compute-pulse');
  void vdotCircle.offsetWidth;
  vdotCircle.classList.add('compute-pulse');
}
```

Note: The VDOT score circle has the class `bg-brand-accent/10` — but since Tailwind uses `/` for opacity, the selector needs escaping. A simpler approach: add an `id` to the VDOT circle container in the HTML, then use `getElementById`.

**Alternative (cleaner):** In the HTML, find the VDOT score circle container and add `id="vdot-circle"`:

```html
<!-- Find this element (the circle around the VDOT score) -->
<div class="... bg-brand-accent/10 ..." id="vdot-circle">
```

Then in `recalculate()`:
```javascript
const vdotCircle = document.getElementById('vdot-circle');
if (vdotCircle) {
  vdotCircle.classList.remove('compute-pulse');
  void vdotCircle.offsetWidth;
  vdotCircle.classList.add('compute-pulse');
}
```

- [ ] **Step 2: Verify build passes**

Run: `npm run build`
Expected: PASS

- [ ] **Step 3: Final manual verification checklist**

Verify all of the following in browser:
- [ ] Tab switch: crossfade with slide-up works
- [ ] Cards: hover produces lift + shadow
- [ ] VDOT score: animates when value changes
- [ ] WIV value: animates when value changes
- [ ] Dew point: animates when value changes
- [ ] Runner level badge: fades in on change
- [ ] Multiplier badge: pulses on recalculation
- [ ] VDOT circle: pulses during computation
- [ ] Buttons: scale down on press
- [ ] Slider thumbs: glow on focus
- [ ] `prefers-reduced-motion`: all animations disabled

- [ ] **Step 4: Commit**

```bash
git add index.html
git commit -m "feat: add computation cue and final polish pass"
```

---

## Task Dependencies

```
Task 1 (CSS Foundation)
  └── Task 2 (Tab Transitions)
  └── Task 3 (Card Hover Depth)
  └── Task 4 (Number Count-Up)
       └── Task 5 (Computation Cue + Polish)
```

Tasks 2, 3, and 4 can run in parallel after Task 1. Task 5 depends on Task 4.
