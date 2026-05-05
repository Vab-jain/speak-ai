/**
 * Prompt Generator
 * Picks a drill topic from the user's configured topic list.
 * Fully synchronous — no API calls.
 * (Groq LLM prompt generation deferred to Issue #3b)
 */

const FALLBACK_TECHNICAL = [
  'Machine Learning',
  'System Design',
  'Reinforcement Learning',
  'RAG',
  'Neural Networks',
  'Microservices',
];

const FALLBACK_GENERAL = [
  'Leadership',
  'Communication',
  'Storytelling',
  'Daily Routine',
  'Creativity',
  'Resilience',
];

/**
 * Picks a random topic from the user's topic list for a One-Minute Speech drill.
 *
 * @param {'technical'|'general'} mode
 * @param {string[]} topics - User-configured topic list
 * @returns {string} The selected topic/prompt
 */
export function generateOneMinuteSpeechPrompt(mode, topics) {
  const pool =
    topics && topics.length > 0
      ? topics
      : mode === 'technical'
      ? FALLBACK_TECHNICAL
      : FALLBACK_GENERAL;

  const idx = Math.floor(Math.random() * pool.length);
  return pool[idx];
}
