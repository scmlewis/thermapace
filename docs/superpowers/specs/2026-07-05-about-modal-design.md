# About Modal Design

## Summary

Add an "About" modal to ThermaPace that documents the app's purpose, usage instructions, author information, and source code link. Triggered from an info icon in the header.

## Trigger

- Add a Lucide `info` icon in the header right side, next to the existing `scmlewis` text link and GitHub icon
- Clicking opens a centered modal overlay
- Modal closes on X button, Escape key, or backdrop click

## Modal Content

### Header
- App name: "ThermaPace VDOT"
- Subtitle: "Thermal Athletic Performance Engine"

### Purpose
2-3 sentences explaining what the app does:
- VDOT-based pace calculator with thermal degradation modeling
- Adjusts training paces for temperature, humidity, wind, and solar radiation
- Built for runners who train in varying climates

### How to Use
3 numbered steps:
1. Enter a race distance and time to calculate your VDOT score
2. Set weather conditions using sliders or smart weather sync
3. Review training recommendations across Setup, Pacing, and Advisory tabs

### Author
- GitHub icon + "scmlewis" linking to `https://github.com/scmlewis`

### Source Code
- GitHub icon + "View on GitHub" linking to `https://github.com/scmlewis/thermapace`

### Tech Stack
Badge-style tags: Tailwind CSS, D3.js, Vite, Lucide Icons

### Footer
"Apache 2.0 License" text

## Styling

- Uses existing `glass-panel` class for the modal container
- Dark overlay (`bg-black/60`) behind modal with `backdrop-blur-sm`
- Max-width ~500px, centered on screen, scrollable on mobile
- Fade-in/out transitions (200ms)
- Close button: `x` icon top-right corner, same hover style as header icons

## Interaction

- Info icon click: `document.getElementById('about-modal').classList.remove('hidden')`
- Close (button/Escape/backdrop): `classList.add('hidden')`
- Body scroll locked when modal is open (`overflow-hidden` on body)
- Focus trapped inside modal when open

## Files to Modify

- `index.html` — Add info icon to header, add modal HTML, add JS event handlers
