import { describe, it, expect } from 'vitest';
import { calculateEnvironmentalLoad } from '../src/engine.js';

describe('calculateEnvironmentalLoad', () => {
  it('returns Ideal for cool, comfortable conditions', () => {
    const r = calculateEnvironmentalLoad(15, 40, 10, 80);
    expect(r.els).toBeLessThanOrEqual(20);
    expect(r.category).toBe('Ideal');
    expect(r.color).toBe('emerald');
  });

  it('returns Warm for moderate conditions', () => {
    const r = calculateEnvironmentalLoad(25, 60, 5, 50);
    expect(r.els).toBeGreaterThan(20);
    expect(r.els).toBeLessThanOrEqual(40);
    expect(r.category).toBe('Warm');
  });

  it('returns Demanding for hot, humid conditions', () => {
    const r = calculateEnvironmentalLoad(28, 65, 5, 40);
    expect(r.els).toBeGreaterThan(40);
    expect(r.els).toBeLessThanOrEqual(60);
    expect(r.category).toBe('Demanding');
  });

  it('returns High Stress for very hot conditions', () => {
    const r = calculateEnvironmentalLoad(30, 70, 0, 0);
    expect(r.els).toBeGreaterThan(60);
    expect(r.els).toBeLessThanOrEqual(80);
    expect(r.category).toBe('High Stress');
  });

  it('returns Extreme for dangerous conditions', () => {
    const r = calculateEnvironmentalLoad(38, 85, 0, 0);
    expect(r.els).toBeGreaterThan(80);
    expect(r.category).toBe('Extreme');
  });

  it('wind reduces the score (cooling effect)', () => {
    const noWind = calculateEnvironmentalLoad(30, 60, 0, 50);
    const withWind = calculateEnvironmentalLoad(30, 60, 20, 50);
    expect(withWind.els).toBeLessThan(noWind.els);
    expect(withWind.wind).toBeGreaterThan(0);
  });

  it('clear sky increases score (solar load)', () => {
    const cloudy = calculateEnvironmentalLoad(30, 60, 0, 100);
    const clear = calculateEnvironmentalLoad(30, 60, 0, 0);
    expect(clear.els).toBeGreaterThan(cloudy.els);
    expect(clear.solar).toBe(10);
    expect(cloudy.solar).toBe(0);
  });

  it('ELS is clamped to 0-100', () => {
    const min = calculateEnvironmentalLoad(0, 10, 60, 100);
    const max = calculateEnvironmentalLoad(50, 100, 0, 0);
    expect(min.els).toBeGreaterThanOrEqual(0);
    expect(max.els).toBeLessThanOrEqual(100);
  });

  it('pace multiplier increases with ELS', () => {
    const low = calculateEnvironmentalLoad(15, 40, 10, 80);
    const mid = calculateEnvironmentalLoad(30, 70, 5, 20);
    const high = calculateEnvironmentalLoad(38, 85, 0, 0);
    expect(low.m_pace).toBe(1.0);
    expect(mid.m_pace).toBeGreaterThan(1.0);
    expect(high.m_pace).toBeGreaterThan(mid.m_pace);
  });

  it('dew point is calculated correctly', () => {
    const r = calculateEnvironmentalLoad(25, 50, 0, 50);
    // Dew point for 25C/50% should be around 13.9C
    expect(r.t_dp).toBeGreaterThan(10);
    expect(r.t_dp).toBeLessThan(20);
  });

  it('handles edge case: 0C', () => {
    const r = calculateEnvironmentalLoad(0, 50, 0, 50);
    expect(r.heat).toBe(0);
    expect(r.els).toBeGreaterThanOrEqual(0);
  });

  it('handles edge case: 50C', () => {
    const r = calculateEnvironmentalLoad(50, 100, 0, 0);
    expect(r.heat).toBe(30);
    expect(r.els).toBeGreaterThan(0);
  });
});
