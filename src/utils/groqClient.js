/**
 * Groq Adapter
 * Deep module wrapping all Groq API interactions behind two core methods:
 * chatCompletion() and transcribe(). All drill-specific prompt templates
 * are data, not code.
 *
 * API key resolution: caller-provided > env var fallback.
 */

const GROQ_CHAT_URL = "https://api.groq.com/openai/v1/chat/completions";
const GROQ_AUDIO_URL = "https://api.groq.com/openai/v1/audio/transcriptions";
const DEFAULT_MODEL = "llama-3.3-70b-versatile";

/**
 * Resolve the API key: prefer explicit key, fall back to env var.
 */
function resolveApiKey(apiKey) {
  const key = apiKey || import.meta.env.VITE_GROQ_API_KEY || '';
  if (!key) {
    console.warn("No Groq API key available. Set it in Settings or VITE_GROQ_API_KEY.");
  }
  return key;
}

// ─── Core Methods ───────────────────────────────────────────────────────────

/**
 * Send a chat completion request to Groq.
 *
 * @param {string} systemPrompt - The system prompt content
 * @param {Object} [options]
 * @param {string} [options.apiKey] - Groq API key (falls back to env var)
 * @param {number} [options.maxTokens=150] - Max tokens in response
 * @param {number} [options.temperature=0.7] - Sampling temperature
 * @param {string} [options.model] - Model override
 * @returns {Promise<string>} The assistant's response text
 */
export async function chatCompletion(systemPrompt, options = {}) {
  const {
    apiKey,
    maxTokens = 150,
    temperature = 0.7,
    model = DEFAULT_MODEL,
  } = options;

  const key = resolveApiKey(apiKey);

  const response = await fetch(GROQ_CHAT_URL, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      messages: [{ role: "system", content: systemPrompt }],
      temperature,
      max_tokens: maxTokens,
    }),
  });

  if (!response.ok) {
    throw new Error(`Groq API Error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  return data.choices[0].message.content.trim();
}

/**
 * Transcribe an audio blob using Groq Whisper.
 *
 * @param {Blob} audioBlob
 * @param {Object} [options]
 * @param {string} [options.apiKey] - Groq API key (falls back to env var)
 * @returns {Promise<string>} Transcription text
 */
export async function transcribeAudio(audioBlob, options = {}) {
  const { apiKey } = options;
  const key = resolveApiKey(apiKey);

  const formData = new FormData();
  formData.append("file", audioBlob, "audio.webm");
  formData.append("model", "whisper-large-v3");

  const response = await fetch(GROQ_AUDIO_URL, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${key}`,
    },
    body: formData,
  });

  if (!response.ok) {
    throw new Error(`Groq API Error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  return data.text.trim();
}

// ─── Prompt Generation ──────────────────────────────────────────────────────

const FALLBACK_TECHNICAL = [
  'Machine Learning', 'System Design', 'Reinforcement Learning',
  'RAG', 'Neural Networks', 'Microservices',
];

const FALLBACK_GENERAL = [
  'Leadership', 'Communication', 'Storytelling',
  'Daily Routine', 'Creativity', 'Resilience',
];

/**
 * Local fallback prompt templates, used when Groq API is unavailable.
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

/**
 * Generate a drill prompt using Groq, with local fallback.
 *
 * @param {string} type - Drill type (e.g. 'ONE_MINUTE_SPEECH')
 * @param {'technical'|'general'} mode
 * @param {string[]} topics - User's topic list
 * @param {Object} [options]
 * @param {string} [options.apiKey] - Groq API key
 * @returns {Promise<string>}
 */
export async function generatePrompt(type, mode, topics, options = {}) {
  const systemPrompt = `You are an expert communication coach. Generate a single, short prompt for a speaking drill.
Mode: ${mode}
Drill Type: ${type}
Topics pool: ${topics && topics.length ? topics.join(', ') : 'Any relevant topic'}.
Rules:
1. Output ONLY the prompt text, nothing else. No quotes, no intro.
2. Keep it concise and actionable.
3. If type is ONE_MINUTE_SPEECH, it should be a broad question or statement to discuss.
4. If type is SHADOW, provide a rich, speakable sentence or a short paragraph (2-3 sentences) to repeat or paraphrase.
5. If type is KEYWORDS, provide a specific technical topic (e.g., "RAG" or "Microservices") and ask them to list as many relevant keywords as possible.
6. If type is LEVEL_EXPLAIN, ask them to explain a specific topic at two difficulty levels.
7. If type is FILLER_RESET, ask them to explain a topic without using fillers.`;

  try {
    return await chatCompletion(systemPrompt, {
      ...options,
      maxTokens: 60,
      temperature: 0.7,
    });
  } catch (err) {
    console.error("Groq prompt generation failed, falling back to local", err);
    return generateLocalPrompt(type, mode, topics);
  }
}

// ─── Feedback Generation ────────────────────────────────────────────────────

const FEEDBACK_FALLBACK = "Unable to generate feedback at this time. Keep practicing!";

/**
 * Generate qualitative feedback for a standard drill.
 *
 * @param {string} transcript
 * @param {string} prompt - The original drill prompt
 * @param {Object} [options]
 * @param {string} [options.apiKey]
 * @returns {Promise<string>}
 */
export async function generateFeedback(transcript, prompt, options = {}) {
  if (!transcript || transcript.trim().length < 10) {
    return "Transcript is too short to provide meaningful feedback. Try speaking a bit more next time!";
  }

  const systemPrompt = `You are an expert communication coach reviewing a student's speech.
The student was asked to speak about/answer this prompt: "${prompt}".
Here is their transcript: "${transcript}"

Provide a brief, encouraging, and constructive qualitative feedback (2-3 short sentences max). 
Focus on:
- Structure and clarity of thoughts.
- Relevance to the prompt.
- Use of vocabulary.
${prompt.toLowerCase().includes('shadow') ? '- Delivery fluency and paraphrasing quality (if they paraphrased instead of repeating exactly).' : ''}
${prompt.toLowerCase().includes('keyword') ? '- Keyword coverage (how many relevant terms did they hit?) and suggest 3-4 key technical terms they missed.' : ''}
Do not mention filler words if there are any, as those are tracked separately. Do not include introductory phrases like "Here is your feedback" or "As a coach". Just provide the feedback directly.`;

  try {
    return await chatCompletion(systemPrompt, { ...options, maxTokens: 150, temperature: 0.5 });
  } catch (error) {
    console.error("Error generating feedback:", error);
    return FEEDBACK_FALLBACK;
  }
}

/**
 * Generate feedback for Level Explain drill (two-phase comparison).
 *
 * @param {string} transcript1 - Phase 1 transcript (High-Schooler)
 * @param {string} transcript2 - Phase 2 transcript (Expert)
 * @param {string} prompt - The concept being explained
 * @param {Object} [options]
 * @param {string} [options.apiKey]
 * @returns {Promise<string>}
 */
export async function generateLevelExplainFeedback(transcript1, transcript2, prompt, options = {}) {
  if (!transcript1 || !transcript2) {
    return "Both phases must have transcripts to provide comparison feedback.";
  }

  const systemPrompt = `You are an expert communication coach reviewing a student's performance in a "Level Explain" drill.
The student was asked to explain this concept: "${prompt}".
First, they explained it to a high-school student: "${transcript1}"
Next, they explained it to an expert: "${transcript2}"

Provide brief, encouraging, and constructive qualitative feedback (3-4 short sentences max).
Focus heavily on:
- How well they adapted their vocabulary and complexity between the two levels.
- Was the high-school version clear and accessible without being condescending?
- Was the expert version appropriately technical, precise, and dense?
Do not mention filler words if there are any, as those are tracked separately. Do not include introductory phrases like "Here is your feedback" or "As a coach". Just provide the feedback directly.`;

  try {
    return await chatCompletion(systemPrompt, { ...options, maxTokens: 200, temperature: 0.5 });
  } catch (error) {
    console.error("Error generating Level Explain feedback:", error);
    return FEEDBACK_FALLBACK;
  }
}

/**
 * Generate feedback for Filler Reset drill.
 *
 * @param {string} transcript
 * @param {number} resetCount
 * @param {string} difficulty - 'easy' or 'hard'
 * @param {number} targetDuration - Target duration in seconds
 * @param {Object} [options]
 * @param {string} [options.apiKey]
 * @returns {Promise<string>}
 */
export async function generateFillerResetFeedback(transcript, resetCount, difficulty, targetDuration, options = {}) {
  const systemPrompt = `You are an expert communication coach reviewing a student's performance in a "Filler Reset" drill.
The student had to speak without using filler words for ${targetDuration} seconds.
Mode: ${difficulty} (In easy mode they self-monitored; in hard mode AI auto-detected).
They reset the timer ${resetCount} times.
Here is their final transcript: "${transcript || '(No transcript available)'}"

Provide brief, encouraging, and constructive qualitative feedback (3-4 short sentences max).
Focus on:
- Commending their effort, especially if they achieved the target duration with few resets.
- If they had many resets, encourage them to slow down their speaking pace and embrace silence instead of fillers.
- Observe any patterns in their final transcript if available.
Do not include introductory phrases like "Here is your feedback" or "As a coach". Just provide the feedback directly.`;

  try {
    return await chatCompletion(systemPrompt, { ...options, maxTokens: 150, temperature: 0.5 });
  } catch (error) {
    console.error("Error generating Filler Reset feedback:", error);
    return FEEDBACK_FALLBACK;
  }
}
