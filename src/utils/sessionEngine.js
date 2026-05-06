/**
 * Session Engine
 * Generates a balanced list of drills for a session.
 * Tracer bullet: all drills are OneMinuteSpeech type.
 */

export const DRILL_TYPES = {
  ONE_MINUTE_SPEECH: 'ONE_MINUTE_SPEECH',
  SHADOW: 'SHADOW',
  KEYWORDS: 'KEYWORDS',
  LEVEL_EXPLAIN: 'LEVEL_EXPLAIN',
  FILLER_RESET: 'FILLER_RESET',
};

// Approximate active drill duration in seconds
const DRILL_DURATION_SECONDS = {
  [DRILL_TYPES.ONE_MINUTE_SPEECH]: 60,
  [DRILL_TYPES.SHADOW]: 90,
  [DRILL_TYPES.KEYWORDS]: 60,
  [DRILL_TYPES.LEVEL_EXPLAIN]: 120,
  [DRILL_TYPES.FILLER_RESET]: 60,
};

const DRILL_LABELS = {
  [DRILL_TYPES.ONE_MINUTE_SPEECH]: 'One-Minute Speech',
  [DRILL_TYPES.SHADOW]: 'Shadow Drill',
  [DRILL_TYPES.KEYWORDS]: 'Rapid-Fire Keywords',
  [DRILL_TYPES.LEVEL_EXPLAIN]: 'Level Explain',
  [DRILL_TYPES.FILLER_RESET]: 'Filler Reset',
};

/**
 * Generates a drill session.
 *
 * @param {number} durationMinutes - Total session duration (10 or 15)
 * @param {'technical'|'general'} mode - The topic mode
 * @returns {Array<{id: string, type: string, durationSeconds: number, mode: string}>}
 */
export function generateSession(durationMinutes, mode) {
  // Drill counts per session duration
  const drillCount = durationMinutes >= 15 ? 5 : 3;
  const types = Object.values(DRILL_TYPES);
  
  // Shuffle types to avoid repeats
  for (let i = types.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [types[i], types[j]] = [types[j], types[i]];
  }

  const drills = [];
  const limit = Math.min(drillCount, types.length);
  for (let i = 0; i < limit; i++) {
    drills.push(createDrill(types[i], mode));
  }

  return drills;
}

function createDrill(type, mode) {
  return {
    id: `drill-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    type,
    label: DRILL_LABELS[type],
    durationSeconds: DRILL_DURATION_SECONDS[type],
    mode,
  };
}

/**
 * Replaces a drill in the session with a new one.
 */
export function swapDrill(drills, drillId, mode) {
  const index = drills.findIndex(d => d.id === drillId);
  if (index === -1) return drills;

  const newDrills = [...drills];
  const types = Object.values(DRILL_TYPES);
  const newType = types[Math.floor(Math.random() * types.length)];
  
  newDrills[index] = createDrill(newType, mode);
  return newDrills;
}

/**
 * Removes a drill from the session.
 */
export function removeDrill(drills, drillId) {
  return drills.filter(d => d.id !== drillId);
}

