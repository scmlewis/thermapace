<div align="center">
  <h1>ThermaPace VDOT</h1>

  <p>Running Environmental Decision Engine — dynamic VDOT pace calculator with real-time weather degradation modeling and training recommendations.</p>

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

It calculates **precise training paces** based on the Jack Daniels VDOT system and adjusts them for **real-time weather conditions** using a multi-factor Environmental Load Score. Built for runners who train and race in varying climates.

## Key Features

### Environmental Load Score (ELS)
- **0-100 Score** — combines temperature, humidity, wind (cooling), and solar load into one interpretable number
- **5 Categories** — Ideal, Warm, Demanding, High Stress, Extreme
- **Factor Breakdown** — see exactly how each environmental factor contributes to your load

### Decision Engine
- **Training-Type-Specific Recommendations** — Easy, Long, Marathon, Threshold, and Intervals each get individual recommendations
- **4 Recommendation Levels** — Recommended, Acceptable, Modify, Avoid
- **Confidence Scores** — how confident the engine is in each recommendation (55-95%)
- **Actionable Outputs** — specific guidance like "Slow your threshold pace by +15 sec/km"

### Advisory
- **Coaching Strategy** — dynamic pacing and hydration advice based on current conditions
- **Track Split Calculator** — per-zone lap times for 400m, 800m, 1km, 1 mile, and 5km intervals
- **Hourly Forecast** — see ELS for each hour and find the best time to run
- **Progressive Disclosure** — expand "Why?" to see environmental factors, calculations, and raw data

### Personalisation
- **Heat Tolerance Setting** — Low/Medium/High adjusts recommendation thresholds
- **Feedback Loop** — rate recommendation accuracy to improve future suggestions

### Setup
- **VDOT Calculator** — enter any race distance and time to compute your VDOT score
- **Smart Weather Sync** — search any city or use GPS to pull live weather from Open-Meteo
- **Weather Presets** — quick-load common conditions

### Pacing
- **D3.js Pace Shift Chart** — visual bar chart showing pace degradation per zone
- **Training Zone Grid** — side-by-side baseline vs. adjusted paces
- **Pace/Speed & Metric/Imperial Toggles**

## Tech Stack

| Layer | Technology |
|-------|-----------|
| UI | Vanilla JavaScript (ES6+), Tailwind CSS 4, Lucide Icons |
| Visualization | D3.js 7 |
| Dev Server | Vite 6 |
| Testing | Vitest |
| Weather Data | Open-Meteo API (free, no key required) |
| Geolocation | Browser Geolocation API |
| PWA | Service Worker with offline caching |
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
  engine.js          — Core calculation engine (ELS, Decision Engine)
tests/
  els.test.js        — Environmental Load Score tests
  decision-engine.test.js — Decision Engine tests
public/
  manifest.json      — PWA manifest
  sw.js              — Service worker with offline caching
  offline.html       — Offline fallback page
index.html           — Single-file application
```

## License

Apache 2.0
