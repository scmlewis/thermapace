# ThermaPace v2 — Evolution Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Evolve ThermaPace from a VDOT calculator with thermal degradation into a Running Environmental Decision Engine — answering "Given today's conditions, what should I do differently?" while preserving the existing VDOT engine and distinctive positioning.

**Architecture Decision:** This plan keeps the single-file architecture for Phases 1-2. The app is ~2100 lines and works well as a single file. Premature modularisation adds complexity without benefit. Phase 3 introduces TypeScript modules when the file size demands it.

**Tech Stack:** Vanilla JS (ES6+), Tailwind CSS 4, D3.js 7, Open-Meteo API, localStorage, Vite

---

## Current State Summary

| Component | Status | What Exists |
|-----------|--------|-------------|
| VDOT Engine | ✅ Mature | Jack Daniels formulas, 4 training zones (E/M/T/I), equivalent performances |
| Thermal Model | ⚠️ Basic | WIV = Temp + Dew Point. Single multiplier applied equally to all zones. |
| Weather API | ✅ Working | Open-Meteo geocoding + forecast. City search + GPS. |
| UI | ✅ Polished | 3-tab layout, D3 chart, dark theme, animations (from UX polish pass) |
| PWA | ❌ Broken | Blob-based service worker (won't work in production). Inline manifest. |
| Testing | ❌ None | Zero test infrastructure |
| TypeScript | ❌ Unused | tsconfig.json exists, no .ts source files |

---

## Phased Approach

```
Phase 1: Foundation Fix + Environmental Load Score (2-3 days)
    ↓
Phase 2: Decision Engine + Confidence (3-4 days)
    ↓
Phase 3: Action Layer + Personalisation Hooks (2-3 days)
    ↓
Phase 4: PWA + Testing + Polish (2 days)
```

---

## Phase 1: Foundation Fix + Environmental Load Score

**Objective:** Fix broken PWA, introduce the Environmental Load Score as the single interpretable number, and refactor the thermal model into a proper Environmental Load Calculator.

### Task 1.1: Fix PWA Setup

**Why:** The current blob-based service worker won't work in production. The manifest is an inline data URI. This blocks offline capability and "Add to Home Screen."

**What changes:**
- Create proper `public/manifest.json` with local icon
- Create `public/sw.js` with cache-first strategy covering all CDN assets
- Create `public/icon-512.png` (simple cyan circle with "TP" text — generate via canvas or use a placeholder)
- Register service worker from a regular JS file, not a blob
- Add offline fallback page (`public/offline.html`)

**Files:**
- Create: `public/manifest.json`
- Create: `public/sw.js`
- Create: `public/offline.html`
- Create: `public/icon-512.png`
- Modify: `index.html` — replace inline manifest + blob SW registration

**Commit:** `fix: replace blob-based PWA with proper manifest and service worker`

---

### Task 1.2: Introduce Environmental Load Score (ELS)

**Why:** The current WIV (Temperature + Dew Point) is a useful but limited metric. It doesn't account for wind, solar radiation, or the non-linear interaction between factors. The ELS (0-100) becomes the foundation of every recommendation.

**The ELS Model:**

```
Inputs:
  temperatureC    (0-50°C)
  relativeHumidity (10-100%)
  dewPointC       (calculated from T + RH)
  windSpeedKmh    (0-60 km/h) — NEW: add to weather fetch
  cloudCover      (0-100%)    — NEW: add to weather fetch

Processing:
  1. Heat Score (0-40):   Non-linear function of temperature
  2. Humidity Score (0-30): Function of dew point relative to temperature
  3. Wind Benefit (0-15):  Cooling effect (reduces score)
  4. Solar Load (0-15):    Cloud cover inversion (clear = more load)

  ELS = clamp(Heat + Humidity - WindBenefit + SolarLoad, 0, 100)

Categories:
  0-20:   Ideal        (emerald)
  21-40:  Warm         (cyan)
  41-60:  Demanding    (amber)
  61-80:  High Stress  (orange)
  81-100: Extreme      (rose)
```

**Why this model:**
- Deterministic and reproducible (no black box)
- Each factor has a clear, bounded contribution
- Wind is subtracted (cooling effect) — physically correct
- Solar load via cloud cover is a proxy for radiation (free data, no API cost)
- Easy to explain: "Heat contributed 28, humidity 18, wind cooled by 5, solar added 3"

**Files:**
- Modify: `index.html` — add `calculateEnvironmentalLoad()` function
- Modify: `index.html` — update `performWeatherSearch()` to fetch wind speed + cloud cover from Open-Meteo
- Modify: `index.html` — update GPS weather fetch to include wind + cloud cover
- Modify: `index.html` — update UI to display ELS score + breakdown

**Open-Meteo API change:**
```
Current: current=temperature_2m,relative_humidity_2m
New:     current=temperature_2m,relative_humidity_2m,wind_speed_10m,cloud_cover
```

**UI additions:**
- Replace WIV display with ELS score (0-100) + category badge
- Add expandable "Why?" section showing factor breakdown:
  - Heat: +28 (from 32°C)
  - Humidity: +18 (dew point 24°C)
  - Wind: -5 (12 km/h breeze)
  - Solar: +3 (clear sky)
  - **Total: 44 — Demanding**

**Commit:** `feat: introduce Environmental Load Score (0-100) replacing WIV`

---

### Task 1.3: Backwards-Compatible WIV Migration

**Why:** Existing users may have saved state with WIV. We need graceful migration.

**What changes:**
- Check localStorage for old WIV-based state
- Migrate to new ELS-based state structure
- Preserve user preferences (unit, viewMode)

**Files:**
- Modify: `index.html` — update `loadState()` with migration logic

**Commit:** `fix: migrate localStorage from WIV to ELS state format`

---

## Phase 2: Decision Engine + Confidence

**Objective:** Transform the thermal penalty multiplier into a proper Decision Engine that provides training-type-specific recommendations with confidence scores.

### Task 2.1: Define Decision Engine Types

**Why:** The spec requires 5 training types (Easy, Long, Marathon, Threshold, Intervals) each with recommendation levels (Recommended, Acceptable, Modify, Avoid). This is the core differentiator.

**The Decision Engine Model:**

```javascript
// Training types with environmental sensitivity
const TRAINING_TYPES = {
  easy:     { name: "Easy Run",           sensitivity: 0.6, maxELS: 85 },
  long:     { name: "Long Run",           sensitivity: 0.8, maxELS: 75 },
  marathon: { name: "Marathon Pace",      sensitivity: 0.9, maxELS: 65 },
  threshold:{ name: "Threshold Workout",  sensitivity: 1.0, maxELS: 55 },
  intervals:{ name: "Interval Training",  sensitivity: 1.2, maxELS: 45 }
};

// Recommendation levels
const RECOMMENDATIONS = {
  recommended: { label: "Recommended", color: "emerald", icon: "check-circle" },
  acceptable:  { label: "Acceptable",  color: "cyan",    icon: "info" },
  modify:      { label: "Modify",      color: "amber",   icon: "alert-triangle" },
  avoid:       { label: "Avoid Today",  color: "rose",    icon: "x-circle" }
};

// Decision logic
function getRecommendation(els, trainingType) {
  const config = TRAINING_TYPES[trainingType];
  const adjustedMax = config.maxELS * (1 + (1 - config.sensitivity) * 0.2);
  
  if (els <= adjustedMax * 0.6)  return "recommended";
  if (els <= adjustedMax * 0.8)  return "acceptable";
  if (els <= adjustedMax)        return "modify";
  return "avoid";
}

// Confidence calculation
function getConfidence(els, trainingType) {
  // Confidence is highest in the middle of a category
  // and lowest at boundaries
  const config = TRAINING_TYPES[trainingType];
  const adjustedMax = config.maxELS;
  const ratio = els / adjustedMax;
  
  // Distance from nearest boundary determines confidence
  const distances = [ratio, 1 - ratio, Math.abs(ratio - 0.6), Math.abs(ratio - 0.8)];
  const minDist = Math.min(...distances);
  
  // Map to 50-95% confidence range
  return Math.round(50 + minDist * 90);
}
```

**Files:**
- Modify: `index.html` — add Decision Engine functions after thermal model

**Commit:** `feat: add Decision Engine with 5 training types and confidence scoring`

---

### Task 2.2: Build Decision Engine UI — Training Recommendations Grid

**Why:** The user needs to see, at a glance, what's recommended for each training type today. This is the primary decision-support output.

**UI Design:**

```
┌─────────────────────────────────────────────────────┐
│  TODAY'S TRAINING RECOMMENDATIONS                   │
├─────────────────────────────────────────────────────┤
│                                                     │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐            │
│  │ 🟢 Easy  │ │ 🟢 Long  │ │ 🟡 Marathon│           │
│  │ Rec'd    │ │ Rec'd    │ │ Modify    │           │
│  │ 92% conf │ │ 88% conf │ │ 71% conf  │           │
│  └──────────┘ └──────────┘ └──────────┘            │
│  ┌──────────┐ ┌──────────┐                         │
│  │ 🔴 Thresh│ │ 🔴 Interv│                         │
│  │ Avoid    │ │ Avoid    │                         │
│  │ 95% conf │ │ 93% conf │                         │
│  └──────────┘ └──────────┘                         │
│                                                     │
│  [▶ Why?] ← expandable explanation                  │
└─────────────────────────────────────────────────────┘
```

**What changes:**
- Add new section to Advisory tab (or create a new "Decision" tab)
- Each training type is a card showing: icon, name, recommendation level (color-coded), confidence percentage
- Expandable "Why?" section shows ELS breakdown and decision rationale

**Files:**
- Modify: `index.html` — add recommendation grid HTML + CSS
- Modify: `index.html` — wire into `recalculate()` to populate recommendations

**Commit:** `feat: add training recommendations grid with confidence scores`

---

### Task 2.3: Action Layer — Concrete Outputs

**Why:** The spec requires actionable outputs, not just recommendations. "Reduce tempo intensity" is vague. "Slow your threshold pace by +15 sec/km" is actionable.

**Action types:**

```javascript
function generateActions(els, vdot, trainingType, recommendation) {
  const actions = [];
  
  if (recommendation === "modify") {
    // Calculate pace adjustment for this specific training type
    const paceMultiplier = calculateTypeMultiplier(els, trainingType);
    actions.push({
      type: "pace_adjustment",
      text: `Slow ${trainingType} pace by +${paceShift} sec/km`,
      severity: "moderate"
    });
  }
  
  if (recommendation === "avoid") {
    actions.push({
      type: "swap_workout",
      text: `Swap to Easy Run today. Resume ${trainingType} tomorrow if conditions improve.`,
      severity: "high"
    });
  }
  
  if (els > 40) {
    actions.push({
      type: "hydration",
      text: "Increase fluid intake by 500ml during run",
      severity: els > 60 ? "high" : "moderate"
    });
  }
  
  if (els > 60) {
    actions.push({
      type: "timing",
      text: "Run early morning or late evening when temperatures are lower",
      severity: "moderate"
    });
  }
  
  return actions;
}
```

**Files:**
- Modify: `index.html` — add `generateActions()` function
- Modify: `index.html` — add action cards below recommendation grid

**Commit:** `feat: add actionable output cards with specific guidance`

---

### Task 2.4: Progressive Disclosure UX

**Why:** The spec requires "Decision → Recommendation → Explanation → Detailed Metrics" as the information hierarchy. Currently the app shows raw numbers first.

**What changes:**
- Default view shows: ELS score + category → Recommendation grid → Action cards
- Expandable "Why?" sections reveal:
  - Environmental factor breakdown (heat, humidity, wind, solar)
  - Decision engine reasoning (which threshold was hit)
  - Confidence calculation explanation
  - Raw environmental data (temperature, humidity, dew point, wind, cloud cover)

**Implementation:**
- Use `<details>/<summary>` elements for expandable sections
- CSS transitions for smooth expand/collapse
- State persists: if user expanded "Why?" last time, remember in localStorage

**Files:**
- Modify: `index.html` — restructure Advisory tab with progressive disclosure
- Modify: `index.html` — add `<details>` sections with explanations

**Commit:** `feat: add progressive disclosure with expandable explanations`

---

## Phase 3: Action Layer + Personalisation Hooks

**Objective:** Add user calibration profiles and feedback loops without implementing ML. Build the interface for future personalisation.

### Task 3.1: User Calibration Profile

**Why:** The spec requires future personalisation support. A simple 3-level heat tolerance selector shifts recommendation thresholds.

**Profile fields:**

```javascript
const defaultProfile = {
  heatTolerance: "medium",    // "low" | "medium" | "high"
  recentAdaptation: "none",   // "none" | "partial" | "full" (last 10-14 days of heat exposure)
  trainingFitness: "moderate" // "building" | "moderate" | "peak"
};
```

**Effect on thresholds:**
- Low tolerance: ELS thresholds shift DOWN by 10 (easier to hit "avoid")
- High tolerance: ELS thresholds shift UP by 10 (harder to hit "avoid")
- Partial adaptation: +5 to all thresholds
- Full adaptation: +10 to all thresholds

**Files:**
- Modify: `index.html` — add profile section (Settings tab or inline)
- Modify: `index.html` — update `getRecommendation()` to use profile-adjusted thresholds

**Commit:** `feat: add user calibration profile with heat tolerance settings`

---

### Task 3.2: Feedback Loop (Lightweight)

**Why:** The spec requires "Historical Accuracy Feedback." Without ML, we can collect simple feedback to improve future recommendations.

**Implementation:**
- After each run, show a 1-question modal: "Was today's recommendation accurate?"
  - 👍 Yes, it was helpful
  - 👎 No, it was too conservative
  - 🤷 No, it was too aggressive
- Store feedback in localStorage with ELS value + recommendation
- After 10+ feedback entries, show a pattern: "You tend to find our recommendations too conservative in humid conditions"
- This data stays local (no backend) — purely for future ML calibration

**Files:**
- Modify: `index.html` — add feedback modal (triggered by a "Rate this" button, not automatic)
- Modify: `index.html` — add `storeFeedback()` and `analyzeFeedback()` functions

**Commit:** `feat: add lightweight feedback loop for recommendation accuracy`

---

### Task 3.3: Forecast-Based Planning

**Why:** The spec mentions checking at 7am for a noon run. Adding a simple hourly forecast view lets users plan when to run.

**Implementation:**
- Extend Open-Meteo API call to include hourly forecast for next 12 hours
- Show a mini timeline: "At 7am: ELS 35 (Warm) → At 10am: ELS 52 (Demanding) → At 1pm: ELS 68 (High Stress)"
- Recommend the best time window: "Run before 9am for ideal conditions"

**API change:**
```
Add: hourly=temperature_2m,relative_humidity_2m,wind_speed_10m,cloud_cover
```

**Files:**
- Modify: `index.html` — add hourly forecast fetch + timeline UI
- Modify: `index.html` — add "Best Time" recommendation card

**Commit:** `feat: add hourly forecast timeline with best-time recommendation`

---

## Phase 4: PWA + Testing + Polish

**Objective:** Ensure production quality, add basic testing, and polish the experience.

### Task 4.1: Complete PWA Implementation

**Why:** Offline-first is a key PWA requirement. Runners check conditions before leaving home — often with poor connectivity.

**What changes:**
- Service worker caches all CDN assets (Tailwind, D3, Lucide, fonts)
- Weather API responses cached for 30 minutes
- Offline fallback shows last-known conditions with a "stale data" warning
- Proper install prompt handling

**Files:**
- Modify: `public/sw.js` — add CDN asset caching
- Modify: `index.html` — add install prompt UI

**Commit:** `feat: complete PWA with offline caching and install prompt`

---

### Task 4.2: Add Testing Foundation

**Why:** The Decision Engine needs verification. Edge cases in weather data can produce wrong recommendations.

**What to test:**
- ELS calculation: verify all factor contributions are correct
- Decision Engine: verify each training type gets correct recommendation for given ELS
- Confidence scores: verify they're in valid range (50-95%)
- Edge cases: ELS=0, ELS=100, extreme humidity, extreme wind
- Weather validation: reject impossible values (negative temperature, humidity > 100%)

**Setup:**
- Add `vitest` as devDependency
- Create `tests/` directory
- Add test scripts to package.json

**Files:**
- Create: `tests/els.test.js` — Environmental Load Score tests
- Create: `tests/decision-engine.test.js` — Decision logic tests
- Modify: `package.json` — add vitest + test scripts

**Commit:** `test: add vitest with ELS and Decision Engine tests`

---

### Task 4.3: Accessibility Pass

**Why:** The spec requires accessibility. Currently no ARIA labels, no keyboard navigation.

**What changes:**
- Add `aria-label` to all interactive elements
- Add `role` attributes to custom components
- Ensure all color combinations meet WCAG AA contrast
- Add keyboard navigation for tab switching
- Add screen reader announcements for dynamic content (recommendations changing)
- Test with VoiceOver/NVDA

**Files:**
- Modify: `index.html` — add ARIA attributes throughout

**Commit:** `a11y: add ARIA labels, keyboard navigation, and screen reader support`

---

### Task 4.4: Final Polish + Documentation

**What changes:**
- Update README with v2 features
- Add inline code comments for Decision Engine (the one place comments are justified)
- Performance audit: ensure ELS calculation is < 10ms
- Mobile responsive audit: test on 320px-768px viewports
- Update deploy workflow with test step

**Files:**
- Modify: `README.md`
- Modify: `index.html` — comments in Decision Engine functions
- Modify: `.github/workflows/deploy.yml` — add test step

**Commit:** `docs: update README for v2, add deploy tests`

---

## File Map (All Phases)

| File | Phase | Changes |
|------|-------|---------|
| `index.html` | 1-4 | All application logic, UI, CSS |
| `public/manifest.json` | 1 | PWA manifest |
| `public/sw.js` | 1,4 | Service worker |
| `public/offline.html` | 1 | Offline fallback |
| `public/icon-512.png` | 1 | App icon |
| `tests/els.test.js` | 4 | ELS unit tests |
| `tests/decision-engine.test.js` | 4 | Decision Engine tests |
| `package.json` | 4 | Add vitest |
| `.github/workflows/deploy.yml` | 4 | Add test step |
| `README.md` | 4 | Update docs |

---

## Task Dependencies

```
Phase 1:
  Task 1.1 (Fix PWA)
  Task 1.2 (Environmental Load Score)
  Task 1.3 (WIV Migration) ← depends on 1.2

Phase 2:
  Task 2.1 (Decision Engine Types) ← depends on 1.2
  Task 2.2 (Recommendations Grid) ← depends on 2.1
  Task 2.3 (Action Layer) ← depends on 2.1
  Task 2.4 (Progressive Disclosure) ← depends on 2.2, 2.3

Phase 3:
  Task 3.1 (User Calibration) ← depends on 2.1
  Task 3.2 (Feedback Loop) ← depends on 2.2
  Task 3.3 (Forecast Planning) ← depends on 1.2

Phase 4:
  Task 4.1 (Complete PWA) ← depends on 1.1
  Task 4.2 (Testing) ← depends on 2.1
  Task 4.3 (Accessibility) ← depends on 2.4
  Task 4.4 (Polish) ← depends on all
```

**Parallel opportunities:**
- 1.1 and 1.2 can run in parallel (no dependencies)
- 2.2 and 2.3 can run in parallel (both depend on 2.1)
- 3.1, 3.2, 3.3 can run in parallel (independent)

---

## Decision Engine Validation Strategy

The ELS is the product's credibility foundation. To validate:

1. **Literature check:** Compare ELS thresholds against WBGT guidelines from sports science (NRC, ACSM heat guidelines)
2. **Edge case mapping:** Test all 5 categories with known scenarios:
   - 15°C, 40% RH, 10 km/h wind → should be "Ideal" (ELS ~15)
   - 30°C, 70% RH, 5 km/h wind → should be "Demanding" (ELS ~55)
   - 38°C, 80% RH, calm wind → should be "Extreme" (ELS ~90)
3. **User testing:** Compare recommendations against WBGT-based protocols used in collegiate athletics
4. **Sensitivity analysis:** Verify that changing one input (e.g., +5°C) produces proportional ELS change

---

## Key Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Keep single-file | Yes (Phases 1-2) | App is ~2100 lines. Splitting adds complexity without benefit. Split in Phase 3 if needed. |
| No ML | Yes | Heuristic models are reproducible, explainable, and sufficient for environmental physics |
| localStorage only | Yes | Privacy-first. No backend. All data stays on device. |
| Open-Meteo | Yes | Free, no API key, reliable. Add hourly forecast endpoint. |
| Confidence range 50-95% | Yes | Never below 50% (we're always somewhat confident). Never above 95% (weather is variable). |
| ELS scale 0-100 | Yes | Intuitive. Matches existing WIV mental model. Easy to explain. |

---

## What Makes This Different From Competitors

| Feature | ThermaPace | Strava/Garmin | Weather Apps |
|---------|-----------|---------------|--------------|
| Training-type-specific advice | ✅ | ❌ | ❌ |
| Confidence scores | ✅ | ❌ | ❌ |
| Environmental Load Score | ✅ | ❌ | Partial (heat index) |
| Actionable outputs | ✅ | ❌ | ❌ |
| Explainable recommendations | ✅ | ❌ | ❌ |
| No account required | ✅ | ❌ | ✅ |
| Offline-first | ✅ | Partial | ❌ |
| Privacy (no data upload) | ✅ | ❌ | Varies |

---

## Verification Checklist (End of Each Phase)

### Phase 1:
- [ ] PWA installs on mobile
- [ ] Service worker caches all assets
- [ ] Offline mode shows last-known data
- [ ] ELS score matches manual calculation for test scenarios
- [ ] Wind and cloud cover fetched from Open-Meteo
- [ ] Build passes

### Phase 2:
- [ ] 5 training types show recommendations
- [ ] Confidence scores are in 50-95% range
- [ ] "Why?" sections expand with explanations
- [ ] Action cards show specific guidance
- [ ] Recommendations change when ELS changes
- [ ] Build passes

### Phase 3:
- [ ] Heat tolerance setting adjusts thresholds
- [ ] Feedback modal appears after "Rate this" click
- [ ] Hourly forecast shows timeline
- [ ] Best time recommendation appears
- [ ] Build passes

### Phase 4:
- [ ] All tests pass
- [ ] ARIA labels on all interactive elements
- [ ] Keyboard navigation works
- [ ] Mobile responsive 320-768px
- [ ] Performance: ELS calculation < 10ms
- [ ] Build passes
