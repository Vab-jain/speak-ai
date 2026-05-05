/**
 * Session Engine
 * Generates a balanced list of drills for a session.
 * Tracer bullet: all drills are OneMinuteSpeech type.
 */

export const DRILL_TYPES = {
  ONE_MINUTE_SPEECH: 'ONE_MINUTE_SPEECH',
  // Future drill types will be added here in Issues #5-#8
};

// Approximate active drill duration in seconds (not counting transitions)
const DRILL_DURATION_SECONDS = {
  [DRILL_TYPES.ONE_MINUTE_SPEECH]: 60,
};

/**
 * Generates a drill session.
 *
 * @param {number} durationMinutes - Total session duration (10 or 15)
 * @param {'technical'|'general'} mode - The topic mode
 * @returns {Array<{id: string, type: string, durationSeconds: number, mode: string}>}
 */
export function generateSession(durationMinutes, mode) {
  // Drill counts per session duration (tracer bullet values)
  const drillCount = durationMinutes >= 15 ? 5 : 3;

  const drills = [];
  for (let i = 0; i < drillCount; i++) {
    drills.push({
      id: `drill-${Date.now()}-${i}`,
      type: DRILL_TYPES.ONE_MINUTE_SPEECH,
      durationSeconds: DRILL_DURATION_SECONDS[DRILL_TYPES.ONE_MINUTE_SPEECH],
      mode,
    });
  }

  return drills;
}
