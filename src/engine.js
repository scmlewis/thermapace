// Core calculation engine — extracted for testing
// These functions are the mathematical foundation of ThermaPace
//
// ENVIRONMENTAL LOAD SCORE (ELS) — 0 to 100
//
// Methodology: humidity-dominant model inspired by WBGT (Wet Bulb Globe
// Temperature), the international standard for athletic heat stress used
// by OSHA, NCAA, ACSM, and World Athletics.  WBGT weights humidity at
// 70%, solar+wind at ~20%, and dry-bulb temperature at ~10%.  We adapt
// these proportions for a running decision engine that needs finer
// granularity than a simple safety flag.
//
// Components:
//   Humidity  0-50   Dew-point driven — the dominant factor in how
//                     effectively the body can cool itself via sweating.
//   Heat      0-30   Air temperature contribution — important but
//                     secondary to humidity's effect on evaporative cooling.
//   Solar     0-10   Clear-sky radiation load — modified by cloud cover.
//                     Matters most when it's already hot and humid.
//   Wind      0-10   Cooling benefit (subtracted) — convective heat
//                     loss.  Real but with diminishing returns.
//
// Category thresholds are calibrated against WBGT research on marathon
// performance (Ely et al. 2007) and ACSM activity-restriction flags.

export function calculateEnvironmentalLoad(tempC, rh, windSpeedKmh, cloudCover) {
  // Dew point (Magnus-Tetens)
  const gamma = (17.625 * tempC) / (243.04 + tempC) + Math.log(rh / 100);
  const t_dp = (243.04 * gamma) / (17.625 - gamma);

  // Humidity Score (0-50): dew-point contribution
  let humidity = 0;
  if (t_dp <= 10) humidity = 0;
  else if (t_dp <= 15) humidity = (t_dp - 10) * 2.0;
  else if (t_dp <= 20) humidity = 10 + (t_dp - 15) * 4.0;
  else if (t_dp <= 25) humidity = 30 + (t_dp - 20) * 3.0;
  else humidity = 45 + Math.min(5, (t_dp - 25) * 1.0);
  humidity = Math.min(50, Math.max(0, humidity));

  // Heat Score (0-30): air temperature contribution
  let heat = 0;
  if (tempC <= 10) heat = 0;
  else if (tempC <= 20) heat = (tempC - 10) * 0.5;
  else if (tempC <= 25) heat = 5 + (tempC - 20) * 1.0;
  else if (tempC <= 30) heat = 10 + (tempC - 25) * 2.0;
  else if (tempC <= 35) heat = 20 + (tempC - 30) * 2.0;
  else heat = 30;
  heat = Math.min(30, Math.max(0, heat));

  // Solar Load (0-10): clear-sky radiation
  const cloud = cloudCover != null ? cloudCover : 50;
  const solar = Math.round(((100 - cloud) / 100) * 10);

  // Wind Benefit (0-10): convective cooling (subtracted)
  const wind = Math.min(10, Math.max(0, (windSpeedKmh || 0) * 0.5));

  // Total ELS
  const els = Math.round(Math.max(0, Math.min(100, humidity + heat + solar - wind)));

  let category, color;
  if (els <= 20)       { category = 'Ideal';       color = 'emerald'; }
  else if (els <= 40)  { category = 'Warm';        color = 'cyan'; }
  else if (els <= 60)  { category = 'Demanding';   color = 'amber'; }
  else if (els <= 80)  { category = 'High Stress'; color = 'orange'; }
  else                 { category = 'Extreme';     color = 'rose'; }

  let m_pace = 1.0;
  if (els <= 20) {
    m_pace = 1.0;
  } else if (els <= 40) {
    m_pace = 1.0 + 0.001 * (els - 20);
  } else if (els <= 60) {
    m_pace = 1.02 + 0.0025 * (els - 40);
  } else if (els <= 80) {
    m_pace = 1.07 + 0.004 * (els - 60);
  } else {
    m_pace = 1.15 + 0.005 * (els - 80);
  }

  return { els, category, color, heat: Math.round(heat), humidity: Math.round(humidity), wind: Math.round(wind), solar, t_dp, m_pace };
}

export const TRAINING_TYPES = [
  { id: 'easy',      name: 'Easy Run',           sensitivity: 0.6, maxELS: 85 },
  { id: 'long',      name: 'Long Run',           sensitivity: 0.8, maxELS: 75 },
  { id: 'marathon',  name: 'Marathon Pace',      sensitivity: 0.9, maxELS: 65 },
  { id: 'threshold', name: 'Threshold Workout',  sensitivity: 1.0, maxELS: 55 },
  { id: 'intervals', name: 'Interval Training',  sensitivity: 1.2, maxELS: 45 }
];

export function getRecommendation(els, trainingType, heatTolerance) {
  const config = TRAINING_TYPES.find(t => t.id === trainingType);
  if (!config) return 'acceptable';
  const tolShift = heatTolerance === 'low' ? -8 : heatTolerance === 'high' ? 8 : 0;
  const adjustedMax = config.maxELS + tolShift;
  if (els <= adjustedMax * 0.55) return 'recommended';
  if (els <= adjustedMax * 0.75) return 'acceptable';
  if (els <= adjustedMax) return 'modify';
  return 'avoid';
}

export function getConfidence(els, trainingType) {
  const config = TRAINING_TYPES.find(t => t.id === trainingType);
  if (!config) return 70;
  const max = config.maxELS;
  const ratio = els / max;
  const boundaries = [0, 0.55, 0.75, 1.0];
  let minDist = 1;
  for (const b of boundaries) {
    minDist = Math.min(minDist, Math.abs(ratio - b));
  }
  return Math.min(95, Math.round(55 + minDist * 80));
}
