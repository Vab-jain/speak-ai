import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  saveSession,
  getStreak,
  getSessions,
  getLongestStreak,
  getHeatmapData,
  getSelfRatingTrend,
  getMetricsTrend
} from '../progressStore';

describe('progressStore', () => {
  let store = {};

  beforeEach(() => {
    // Mock localStorage
    store = {};
    vi.stubGlobal('localStorage', {
      getItem: vi.fn((key) => store[key] || null),
      setItem: vi.fn((key, value) => {
        store[key] = value.toString();
      }),
      clear: vi.fn(() => {
        store = {};
      }),
    });
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('initializes with empty data', () => {
    expect(getSessions()).toEqual([]);
    expect(getStreak()).toBe(0);
    expect(getLongestStreak()).toBe(0);
  });

  it('saves a session and starts streak', () => {
    const d = new Date('2026-05-01T12:00:00Z');
    vi.setSystemTime(d);
    
    saveSession({ mode: 'general' });
    
    expect(getSessions().length).toBe(1);
    expect(getStreak()).toBe(1);
    expect(getLongestStreak()).toBe(1);
  });

  it('increments streak on consecutive days', () => {
    // Day 1
    vi.setSystemTime(new Date('2026-05-01T12:00:00Z'));
    saveSession({ mode: 'general' });
    
    // Day 2
    vi.setSystemTime(new Date('2026-05-02T12:00:00Z'));
    saveSession({ mode: 'technical' });

    expect(getStreak()).toBe(2);
    expect(getLongestStreak()).toBe(2);
  });

  it('maintains streak if practiced multiple times same day', () => {
    vi.setSystemTime(new Date('2026-05-01T10:00:00Z'));
    saveSession({ mode: 'general' });
    
    vi.setSystemTime(new Date('2026-05-01T15:00:00Z'));
    saveSession({ mode: 'technical' });

    expect(getStreak()).toBe(1);
    expect(getSessions().length).toBe(2);
  });

  it('breaks streak on missed day', () => {
    // Day 1
    vi.setSystemTime(new Date('2026-05-01T12:00:00Z'));
    saveSession({ mode: 'general' });
    
    // Day 3 (skipped Day 2)
    vi.setSystemTime(new Date('2026-05-03T12:00:00Z'));
    expect(getStreak()).toBe(0); // Before saving, checking streak sees it's broken

    saveSession({ mode: 'technical' }); // Saving restarts it
    expect(getStreak()).toBe(1);
    expect(getLongestStreak()).toBe(1); // Longest should still be 1 here
  });

  it('getHeatmapData returns 30 entries', () => {
    vi.setSystemTime(new Date('2026-05-15T12:00:00Z'));
    saveSession({ mode: 'general' });
    
    const heatmap = getHeatmapData(30);
    expect(heatmap.length).toBe(30);
    expect(heatmap[29].count).toBe(1); // Today
  });

  it('getSelfRatingTrend maps correctly', () => {
    vi.setSystemTime(new Date('2026-05-01T12:00:00Z'));
    saveSession({ selfRating: { clarity: 8, confidence: 7, vocabulary: 6 } });
    
    const trend = getSelfRatingTrend();
    expect(trend.length).toBe(1);
    expect(trend[0].clarity).toBe(8);
  });

  it('getMetricsTrend averages correctly', () => {
    vi.setSystemTime(new Date('2026-05-01T12:00:00Z'));
    saveSession({ 
      drills: [
        { metrics: { wpm: 120, fillerCount: 2 } },
        { metrics: { wpm: 140, fillerCount: 4 } }
      ]
    });
    
    const trend = getMetricsTrend();
    expect(trend.length).toBe(1);
    expect(trend[0].avgWpm).toBe(130);
    expect(trend[0].avgFillerCount).toBe(3);
  });
});
