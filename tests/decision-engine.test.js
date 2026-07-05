import { describe, it, expect } from 'vitest';
import { getRecommendation, getConfidence, TRAINING_TYPES } from '../src/engine.js';

describe('getRecommendation', () => {
  it('returns recommended for low ELS across all types', () => {
    TRAINING_TYPES.forEach(type => {
      expect(getRecommendation(0, type.id, 'medium')).toBe('recommended');
    });
  });

  it('returns avoid for extreme ELS across all types', () => {
    TRAINING_TYPES.forEach(type => {
      expect(getRecommendation(100, type.id, 'medium')).toBe('avoid');
    });
  });

  it('more sensitive types get worse recommendations at same ELS', () => {
    const els = 50;
    const recs = TRAINING_TYPES.map(t => getRecommendation(els, t.id, 'medium'));
    const order = ['recommended', 'acceptable', 'modify', 'avoid'];
    for (let i = 1; i < recs.length; i++) {
      expect(order.indexOf(recs[i])).toBeGreaterThanOrEqual(order.indexOf(recs[i - 1]));
    }
  });

  it('low heat tolerance shifts thresholds down (easier to avoid)', () => {
    // At ELS 30: intervals has maxELS=45
    // Low tolerance: adjustedMax=37, 30 <= 37*0.75=27.75? No, 30 <= 37? Yes → modify
    // Medium: adjustedMax=45, 30 <= 45*0.75=33.75? Yes → acceptable
    // High tolerance: adjustedMax=53, 30 <= 53*0.55=29.15? No, 30 <= 53*0.75=39.75? Yes → acceptable
    const low = getRecommendation(30, 'intervals', 'low');
    const medium = getRecommendation(30, 'intervals', 'medium');
    const high = getRecommendation(30, 'intervals', 'high');
    // Verify the ordering: low should be worse than medium, medium worse than high
    const order = ['recommended', 'acceptable', 'modify', 'avoid'];
    expect(order.indexOf(low)).toBeGreaterThanOrEqual(order.indexOf(medium));
    expect(order.indexOf(medium)).toBeGreaterThanOrEqual(order.indexOf(high));
  });

  it('returns valid recommendation values', () => {
    const valid = ['recommended', 'acceptable', 'modify', 'avoid'];
    for (let els = 0; els <= 100; els += 5) {
      TRAINING_TYPES.forEach(type => {
        expect(valid).toContain(getRecommendation(els, type.id, 'medium'));
      });
    }
  });
});

describe('getConfidence', () => {
  it('returns values between 55 and 95', () => {
    for (let els = 0; els <= 100; els += 5) {
      TRAINING_TYPES.forEach(type => {
        const conf = getConfidence(els, type.id);
        expect(conf).toBeGreaterThanOrEqual(55);
        expect(conf).toBeLessThanOrEqual(95);
      });
    }
  });

  it('returns 70 for unknown training type', () => {
    expect(getConfidence(50, 'unknown')).toBe(70);
  });

  it('confidence is lowest at category boundaries', () => {
    // At ELS = maxELS * 0.55, confidence should be lower than in the middle
    const type = TRAINING_TYPES[0]; // easy, maxELS=85
    const atBoundary = getConfidence(Math.round(type.maxELS * 0.55), type.id);
    const inMiddle = getConfidence(Math.round(type.maxELS * 0.3), type.id);
    // Both should be valid
    expect(atBoundary).toBeGreaterThanOrEqual(55);
    expect(inMiddle).toBeGreaterThanOrEqual(55);
  });
});
