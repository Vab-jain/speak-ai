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
 * Picks a random topic from the user's topic list for a drill.
 *
 * @param {string} type - The drill type
 * @param {'technical'|'general'} mode
 * @param {string[]} topics - User-configured topic list
 * @returns {string} The selected topic/prompt
 */
export function generatePrompt(type, mode, topics) {
  // Use existing logic for ONE_MINUTE_SPEECH
  if (type === 'ONE_MINUTE_SPEECH') {
    return generateOneMinuteSpeechPrompt(mode, topics);
  }

  // Fallback for other types until they are implemented
  const pool =
    topics && topics.length > 0
      ? topics
      : mode === 'technical'
      ? FALLBACK_TECHNICAL
      : FALLBACK_GENERAL;

  const topic = pool[Math.floor(Math.random() * pool.length)];

  switch (type) {
    case 'SHADOW':
      return `Listen and repeat: "In a world of ${topic}, the most important principle is clarity of communication."`;
    case 'KEYWORDS':
      return `Rattle off as many keywords as possible related to: ${topic}`;
    case 'LEVEL_EXPLAIN':
      return `Explain ${topic} to a high-schooler, then to an expert.`;
    case 'FILLER_RESET':
      return `Speak about ${topic} without using any filler words.`;
    default:
      return topic;
  }
}

/**
 * Legacy wrapper for One-Minute Speech
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

