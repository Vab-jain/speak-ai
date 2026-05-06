/**
 * Progress Store
 * LocalStorage persistence layer for session history and streak calculation.
 */

import { readStorage, writeStorage } from './storageAdapter';

const STORAGE_KEY = 'speakup_progress';
const getDefaultState = () => ({ sessions: [], streak: { current: 0, lastDate: null } });

function getStore() {
  return readStorage(STORAGE_KEY, getDefaultState());
}

function saveStore(data) {
  writeStorage(STORAGE_KEY, data);
}

/**
 * Calculates current streak based on session history.
 * Resets if more than 1 day has passed since lastDate.
 */
function calculateStreak(currentStreak, lastDateStr) {
  if (!lastDateStr) return 1; // First session ever

  const now = new Date();
  const last = new Date(lastDateStr);

  // Normalize to start of day for comparison
  now.setHours(0, 0, 0, 0);
  last.setHours(0, 0, 0, 0);

  const diffTime = now.getTime() - last.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return currentStreak; // Already practiced today
  } else if (diffDays === 1) {
    return currentStreak + 1; // Consecutive day
  } else {
    return 1; // Streak broken
  }
}

/**
 * Saves a completed session to history and updates streak.
 * @param {Object} sessionData - The completed session object
 */
export function saveSession(sessionData) {
  const store = getStore();
  const todayStr = new Date().toISOString();

  // Add session
  const newSession = {
    ...sessionData,
    id: `session-${Date.now()}`,
    date: todayStr,
  };
  store.sessions.push(newSession);

  // Update streak
  store.streak.current = calculateStreak(store.streak.current, store.streak.lastDate);
  store.streak.lastDate = todayStr;

  saveStore(store);
}

/**
 * Retrieves the current streak number.
 * Note: Should also check if streak is broken by inactivity when just reading.
 */
export function getStreak() {
  const store = getStore();
  if (!store.streak.lastDate) return 0;

  const now = new Date();
  const last = new Date(store.streak.lastDate);
  now.setHours(0, 0, 0, 0);
  last.setHours(0, 0, 0, 0);

  const diffTime = now.getTime() - last.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays > 1) {
    // Streak broken by inactivity
    return 0;
  }
  return store.streak.current;
}

/**
 * Gets all past sessions
 */
export function getSessions() {
  return getStore().sessions;
}

/**
 * Computes the longest streak ever achieved by looking at consecutive session dates.
 * @returns {number}
 */
export function getLongestStreak() {
  const sessions = getStore().sessions;
  if (!sessions.length) return 0;

  // Get unique practice days as YYYY-MM-DD strings, sorted
  const days = [...new Set(sessions.map(s => s.date.slice(0, 10)))].sort();

  let longest = 1;
  let current = 1;
  for (let i = 1; i < days.length; i++) {
    const prev = new Date(days[i - 1]);
    const curr = new Date(days[i]);
    const diff = Math.round((curr - prev) / (1000 * 60 * 60 * 24));
    if (diff === 1) {
      current++;
      longest = Math.max(longest, current);
    } else {
      current = 1;
    }
  }
  return longest;
}

/**
 * Returns heatmap data for the last N days.
 * Each entry: { date: 'YYYY-MM-DD', count: number }
 * @param {number} days
 * @returns {Array<{date: string, count: number}>}
 */
export function getHeatmapData(days = 30) {
  const sessions = getStore().sessions;
  const countsByDay = {};
  sessions.forEach(s => {
    const day = s.date.slice(0, 10);
    countsByDay[day] = (countsByDay[day] || 0) + 1;
  });

  const result = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    result.push({ date: key, count: countsByDay[key] || 0 });
  }
  return result;
}

/**
 * Returns per-session self-rating trend data.
 * @returns {Array<{date: string, clarity: number, confidence: number, vocabulary: number}>}
 */
export function getSelfRatingTrend() {
  const sessions = getStore().sessions;
  return sessions
    .filter(s => s.selfRating)
    .map(s => ({
      date: s.date.slice(0, 10),
      clarity: s.selfRating.clarity ?? 0,
      confidence: s.selfRating.confidence ?? 0,
      vocabulary: s.selfRating.vocabulary ?? 0,
    }));
}

/**
 * Returns per-session average WPM and filler count trend.
 * @returns {Array<{date: string, avgWpm: number, avgFillerCount: number}>}
 */
export function getMetricsTrend() {
  const sessions = getStore().sessions;
  return sessions
    .filter(s => s.drills && s.drills.length > 0)
    .map(s => {
      const drills = s.drills;
      const avgWpm = Math.round(
        drills.reduce((sum, d) => sum + (d.metrics?.wpm || 0), 0) / drills.length
      );
      const avgFillerCount = Math.round(
        drills.reduce((sum, d) => sum + (d.metrics?.fillerCount || 0), 0) / drills.length
      );
      return { date: s.date.slice(0, 10), avgWpm, avgFillerCount };
    });
}
