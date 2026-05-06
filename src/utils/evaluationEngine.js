/**
 * Evaluation Engine
 * Pure functions for computing drill metrics from Web Speech API transcripts.
 * (Groq qualitative feedback deferred to Issue #3b)
 */

/** Default filler words list. Can be overridden by user settings. */
export const DEFAULT_FILLER_WORDS = [
  'um',
  'uh',
  'like',
  'you know',
  'basically',
  'sort of',
  'kind of',
  'actually',
  'literally',
  'right',
  'so',
  'i mean',
];

/**
 * Calculates words per minute from a transcript and drill duration.
 *
 * @param {string} transcript
 * @param {number} durationSeconds - How long the user actually spoke
 * @returns {number} WPM rounded to nearest integer
 */
export function calculateWPM(transcript, durationSeconds) {
  if (!transcript || !transcript.trim() || durationSeconds <= 0) return 0;
  const wordCount = transcript.trim().split(/\s+/).length;
  const minutes = durationSeconds / 60;
  return Math.round(wordCount / minutes);
}

/**
 * Counts filler words in a transcript using whole-word matching.
 * "likewise" will NOT trigger "like".
 *
 * @param {string} transcript
 * @param {string[]} fillerList - List of filler words/phrases to detect
 * @returns {{ count: number, detected: string[] }}
 */
export function countFillers(transcript, fillerList = DEFAULT_FILLER_WORDS) {
  if (!transcript || !transcript.trim()) return { count: 0, detected: [] };

  const lower = transcript.toLowerCase();
  const detected = [];

  for (const filler of fillerList) {
    // Use word-boundary regex for single-word fillers; phrase match for multi-word
    const escapedFiller = filler.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
    const pattern = filler.includes(' ')
      ? new RegExp(escapedFiller, 'gi')
      : new RegExp(`\\b${escapedFiller}\\b`, 'gi');

    const matches = lower.match(pattern);
    if (matches && matches.length > 0) {
      for (let i = 0; i < matches.length; i++) {
        detected.push(filler);
      }
    }
  }

  return { count: detected.length, detected };
}

/**
 * Computes all metrics for a completed drill.
 *
 * @param {string} transcript - Web Speech API transcript
 * @param {number} durationSeconds - How long the drill ran
 * @param {string[]} fillerList - Filler word list
 * @returns {{ wpm: number, fillerCount: number, detectedFillers: string[], transcript: string }}
 */
export function evaluateDrill(transcript, durationSeconds, fillerList = DEFAULT_FILLER_WORDS) {
  const wpm = calculateWPM(transcript, durationSeconds);
  const { count: fillerCount, detected: detectedFillers } = countFillers(transcript, fillerList);
  return { wpm, fillerCount, detectedFillers, transcript };
}

/**
 * Extracts and counts matching keywords from a transcript based on a target list.
 *
 * @param {string} transcript
 * @param {string[]} targetKeywords
 * @returns {{ count: number, matched: string[] }}
 */
export function extractKeywords(transcript, targetKeywords) {
  if (!transcript || !transcript.trim() || !targetKeywords || !targetKeywords.length) {
    return { count: 0, matched: [] };
  }

  const lower = transcript.toLowerCase();
  const matched = [];

  for (const kw of targetKeywords) {
    const escaped = kw.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
    const pattern = new RegExp(`\\b${escaped}\\b`, 'gi');
    if (pattern.test(lower)) {
      matched.push(kw);
    }
  }

  return { count: matched.length, matched };
}
