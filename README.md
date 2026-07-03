<div align="center">
  <h1>ThermaPace VDOT</h1>

  <p>Thermal Athletic Performance Engine — dynamic VDOT pace calculator with real-time weather degradation modeling.</p>

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

ThermaPace VDOT calculates **precise training paces** based on the Jack Daniels VDOT system and adjusts them for **real-time weather conditions** using empirical thermal degradation models. Built for runners who train and race in varying climates — from humid summers to dry desert heat.

## Key Features

### Setup
- **VDOT Calculator** — enter any race distance and time to compute your VDOT score, runner level, and equivalent performances across 5K, 10K, half marathon, and marathon.
- **Smart Weather Sync** — search any city or use GPS geolocation to pull live weather data (temperature, humidity, dew point) from Open-Meteo.
- **Weather Presets** — quick-load common conditions (Standard Baseline, Subtropical Humid, Desert Dry Heat, Extreme Oppressive).
- **WIV Thermal Model** — Weather Impact Value (temperature + dew point) drives a calibrated pace degradation multiplier.

### Pacing
- **D3.js Pace Shift Chart** — visual bar chart showing seconds-per-kilometer added per training zone due to thermal strain.
- **Training Zone Grid** — side-by-side baseline vs. adjusted paces for all five VDOT zones: Easy (E), Marathon (M), Threshold (T), Interval (I), and Repetition (R). Desktop table view with mobile card fallback.
- **Pace/Speed & Metric/Imperial Toggles** — toggle between pace, speed, metric, and imperial units.

### Advisory
- **Thermal Penalty Index** — real-time meter showing combined strain value with category labels.
- **Coaching Strategy** — dynamic pacing strategy and hydration advice based on current WIV level.
- **Track Split Calculator** — per-zone lap times for 400m, 800m, 1km, 1 mile, and 5km intervals, adjusted for weather.
- **Copy Pacing Card** — one-click copy of the full athletic profile to share.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| UI | Vanilla JavaScript (ES6+), Tailwind CSS 4 (CDN), Lucide Icons (CDN) |
| Visualization | D3.js 7 (CDN) |
| Dev Server | Vite 6 |
| Weather Data | Open-Meteo API (free, no key required) |
| Geolocation | Browser Geolocation API |
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

The app runs at `http://localhost:3000`.

> **Note:** Weather search is powered by the free [Open-Meteo API](https://open-meteo.com/) — no API key needed. Geolocation requires browser permission.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server (port 3000) |
| `npm run build` | Build for production to `dist/` |
| `npm run preview` | Preview production build locally |

## License

Apache 2.0
