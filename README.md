<div align="center">
  <h1>ThermaPace</h1>

  <p>Running Environmental Decision Engine — VDOT-based pace calculator with real-time weather-aware training recommendations.</p>

  <p>
    <a href="https://scmlewis.github.io/thermapace/"><strong>Launch App »</strong></a>
  </p>

  <p>
    <img src="https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?logo=tailwindcss&logoColor=white" alt="Tailwind CSS 4" />
    <img src="https://img.shields.io/badge/D3.js-7-F9A03C?logo=d3.js&logoColor=white" alt="D3.js 7" />
    <img src="https://img.shields.io/badge/license-Apache_2.0-blue" alt="License" />
  </p>

</div>

---

## Overview

ThermaPace is not a weather dashboard. It answers one question: **"Given today's environmental conditions, what should I do differently during today's run?"**

It calculates **precise training paces** using the Jack Daniels VDOT system and adjusts them via a WBGT-inspired **Environmental Load Score** that models how temperature, humidity, wind, and solar radiation affect thermoregulation during exercise. Built for runners who train and race in varying climates.

## Key Features

### Environmental Load Score (ELS)
A 0-100 composite score derived from four environmental factors, weighted according to WBGT research on athletic heat stress:

| Factor | Range | What it captures |
|--------|-------|------------------|
| **Humidity** | 0-50 | Dew-point driven — dominant factor in evaporative cooling |
| **Temperature** | 0-30 | Air temperature — secondary to humidity's effect on cooling |
| **Solar** | 0-10 | Clear-sky radiation load — modified by cloud cover |
| **Wind** | 0-10 | Convective cooling (subtracted) — real but diminishing returns |

- **5 Categories** — Ideal, Warm, Demanding, High Stress, Extreme
- **Factor Breakdown** — see exactly how each environmental factor contributes

### Decision Engine
- **5 Training Types** — Easy, Long, Marathon, Threshold, Intervals — each with individual sensitivity to heat
- **4 Recommendation Levels** — Recommended, Acceptable, Modify, Avoid
- **Confidence Scores** — 55-95% based on proximity to category boundaries
- **Actionable Outputs** — specific guidance: pace adjustments, workout swaps, hydration, timing, duration

### Advisory Tab
- **ELS Meter** — animated score display with color-coded progress bar and factor breakdown
- **Coaching Strategy** — dynamic pacing and hydration advice based on current ELS
- **Training Recommendations Grid** — 5 cards with recommendation level and confidence per training type
- **Progressive Disclosure** — expand "Why?" to see raw conditions and calculation breakdown
- **Hourly Forecast Timeline** — ELS per hour with best-time-to-run recommendation (appears after weather sync)
- **Track Split Calculator** — per-zone lap times for 400m, 800m, 1km, 1 mile, and 5km intervals

### Pacing Tab
- **D3.js Pace Shift Chart** — animated bar chart showing seconds-per-km penalty per training zone
- **Training Zone Grid** — baseline vs. weather-adjusted paces with pace/speed toggle
- **Metric/Imperial Toggle** — switch between km and miles

### Setup Tab
- **VDOT Calculator** — enter any race distance and time to compute VDOT score
- **Equivalent Race Times** — baseline and weather-adjusted predictions for 5K, 10K, Half, Full
- **Runner Level Classification** — Beginner through International Elite based on VDOT
- **Smart Weather Sync** — search any city or use GPS to pull live weather from Open-Meteo
- **Weather Presets** — quick-load Standard, Subtropical Humid, Desert Dry Heat, Extreme Oppressive
- **4 Environmental Sliders** — temperature, humidity, wind speed, cloud cover
- **Heat Tolerance Setting** — Low/Medium/High adjusts recommendation thresholds

### Personalisation
- **Feedback Loop** — rate each recommendation (Too conservative / Just right / Too aggressive); pattern analysis after 10+ entries suggests heat tolerance adjustments
- **Copy Pacing Card** — formatted text summary to clipboard with VDOT, weather, adjusted paces, and coaching advice

### PWA & Offline
- **Installable** — PWA manifest with service worker for offline caching
- **Offline Fallback** — graceful degradation when network is unavailable
- **State Persistence** — all inputs and preferences saved to localStorage

## Tech Stack

| Layer | Technology |
|-------|-----------|
| UI | Vanilla JavaScript (ES6+), Tailwind CSS 4, Lucide Icons |
| Visualization | D3.js 7 |
| Dev Server | Vite 6 |
| Testing | Vitest (20 tests) |
| Weather Data | Open-Meteo API (free, no key required) |
| Geolocation | Browser Geolocation API |
| PWA | Service Worker with cache-first static / network-first weather |
| Persistence | localStorage |
| Deployment | GitHub Pages (via GitHub Actions) |

## Getting Started

```bash
# Clone the repo
git clone https://github.com/scmlewis/thermapace.git
cd thermapace

# Install dependencies
npm install

# Start dev server
npm run dev
```

The app runs at `http://localhost:3000/thermapace/`.

> **Note:** Weather search is powered by the free [Open-Meteo API](https://open-meteo.com/) — no API key needed. Geolocation requires browser permission.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server (port 3000) |
| `npm run build` | Build for production to `dist/` |
| `npm run preview` | Preview production build locally |
| `npm run test` | Run unit tests (Vitest) |
| `npm run test:watch` | Run tests in watch mode |

## Architecture

```
src/
  engine.js                    — Core calculation engine (ELS + Decision Engine)
tests/
  els.test.js                  — 12 Environmental Load Score tests
  decision-engine.test.js      — 8 Decision Engine tests
public/
  manifest.json                — PWA manifest
  sw.js                        — Service worker (cache-first static, network-first weather)
  offline.html                 — Offline fallback page
index.html                     — Single-file application (~2600 lines)
```

### Core Functions

| Function | Purpose |
|----------|---------|
| `calculateEnvironmentalLoad(tempC, rh, wind, cloud)` | WBGT-inspired 0-100 ELS score |
| `getRecommendation(els, type)` | Training-type-specific recommendation level |
| `getConfidence(els, type)` | Confidence percentage (55-95%) |
| `generateActions(els, m_pace, type, rec)` | Actionable coaching items |
| `getVO2Cost(v)` / `getDropFactor(t)` | Jack Daniels VDOT formulas |
| `getVelocityFromVO2(vo2)` | Reverse VDOT to velocity |
| `getEquivTimeForVDOT(vdot, dist)` | Binary search for equivalent race time |
| `getRunnerLevel(vdot)` | Runner classification by VDOT |
| `recalculate()` | Master recalculation — orchestrates all computations and DOM updates |
| `renderD3PaceShiftChart(paces)` | D3.js bar chart of pace degradation |
| `performWeatherSearch()` | Open-Meteo geocoding + forecast fetch |
| `saveState()` / `loadState()` | localStorage persistence |

## ELS Methodology

The Environmental Load Score is a humidity-dominant model inspired by WBGT (Wet Bulb Globe Temperature), the international standard for athletic heat stress used by OSHA, NCAA, ACSM, and World Athletics.

**Why humidity dominates:** Evaporative cooling (sweating) is the body's primary heat-dissipation mechanism during exercise. Humidity directly determines how effectively sweat can evaporate. WBGT weights the wet-bulb temperature component at 70% for this reason.

**Category thresholds** are calibrated against WBGT research on marathon performance (Ely et al. 2007) and ACSM/NATA activity-restriction flags:

| ELS Range | Category | WBGT Equivalent | Guidance |
|-----------|----------|-----------------|----------|
| 0-20 | Ideal | <18°C | No restrictions |
| 20-40 | Warm | 18-23°C | Minor adjustments |
| 40-60 | Demanding | 23-28°C | Pace reduction needed |
| 60-80 | High Stress | 28-32°C | Significant modification |
| 80-100 | Extreme | >32°C | Avoid intense training |

## License

Apache 2.0
