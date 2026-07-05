// Core calculation engine — extracted for testing
// These functions are the mathematical foundation of ThermaPace

export function calculateEnvironmentalLoad(tempC, rh, windSpeedKmh, cloudCover) {
  const gamma = (17.625 * tempC) / (243.04 + tempC) + Math.log(rh / 100);
  const t_dp = (243.04 * gamma) / (17.625 - gamma);

  let heat = 0;
  if (tempC <= 10) heat = 0;
  else if (tempC <= 20) heat = (tempC - 10) * 0.5;
  else if (tempC <= 25) heat = 5 + (tempC - 20) * 1.0;
  else if (tempC <= 30) heat = 10 + (tempC - 25) * 2.0;
  else if (tempC <= 35) heat = 20 + (tempC - 30) * 3.0;
  else heat = 35 + (tempC - 35) * 1.0;
  heat = Math.min(40, Math.max(0, heat));

  let humidity = 0;
  if (t_dp <= 10) humidity = 0;
  else if (t_dp <= 15) humidity = (t_dp - 10) * 1.0;
  else if (t_dp <= 20) humidity = 5 + (t_dp - 15) * 1.4;
  else if (t_dp <= 25) humidity = 12 + (t_dp - 20) * 1.6;
  else humidity = 20 + Math.min(10, (t_dp - 25) * 1.5);
  humidity = Math.min(30, Math.max(0, humidity));

  const wind = Math.min(15, Math.max(0, (windSpeedKmh || 0) * 0.75));
  const cloud = cloudCover != null ? cloudCover : 50;
  const solar = Math.round(((100 - cloud) / 100) * 15);
  const els = Math.round(Math.max(0, Math.min(100, heat + humidity - wind + solar)));

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
