/**
 * Prompt Generator
 * Picks a drill topic from the user's configured topic list.
 * Now uses Groq LLM for dynamic prompt generation (Issue #3b).
 */

import { generateGroqPrompt } from './groqClient';

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
 * Picks a random topic from the user's topic list for a drill, ideally using Groq API.
 *
 * @param {string} type - The drill type
 * @param {'technical'|'general'} mode
 * @param {string[]} topics - User-configured topic list
 * @returns {Promise<string>} The selected topic/prompt
 */
export async function generatePrompt(type, mode, topics) {
  try {
    const prompt = await generateGroqPrompt(type, mode, topics);
    return prompt;
  } catch (err) {
    console.error("Groq generation failed, falling back to local generation", err);
    return generateLocalPrompt(type, mode, topics);
  }
}

/**
 * Legacy wrapper for One-Minute Speech (now async)
 */
export async function generateOneMinuteSpeechPrompt(mode, topics) {
  return generatePrompt('ONE_MINUTE_SPEECH', mode, topics);
}

/**
 * Local fallback generation
 */
function generateLocalPrompt(type, mode, topics) {
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

