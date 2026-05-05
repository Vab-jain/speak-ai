/**
 * Progress Store
 * LocalStorage persistence layer for session history and streak calculation.
 */

const STORAGE_KEY = 'speakup_progress';

function getStore() {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : { sessions: [], streak: { current: 0, lastDate: null } };
  } catch (err) {
    console.error('Failed to parse progress from localStorage', err);
    return { sessions: [], streak: { current: 0, lastDate: null } };
  }
}

function saveStore(data) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (err) {
    console.error('Failed to save progress to localStorage', err);
  }
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
