const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY;

if (!GROQ_API_KEY) {
  console.warn("VITE_GROQ_API_KEY is not set. Groq features may fail.");
}

const GROQ_CHAT_URL = "https://api.groq.com/openai/v1/chat/completions";
const GROQ_AUDIO_URL = "https://api.groq.com/openai/v1/audio/transcriptions";

/**
 * Generate a dynamic prompt using Groq LLM based on drill type and topics.
 * @param {string} type Drill type (e.g., ONE_MINUTE_SPEECH)
 * @param {string} mode 'technical' or 'general'
 * @param {string[]} topics Array of topics to choose from
 * @returns {Promise<string>}
 */
export async function generateGroqPrompt(type, mode, topics) {
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
    const response = await fetch(GROQ_CHAT_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${GROQ_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [{ role: "system", content: systemPrompt }],
        temperature: 0.7,
        max_tokens: 60,
      }),
    });

    if (!response.ok) {
      throw new Error(`Groq API Error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.choices[0].message.content.trim();
  } catch (error) {
    console.error("Error generating Groq prompt:", error);
    throw error;
  }
}

/**
 * Transcribe an audio blob using Groq Whisper.
 * @param {Blob} audioBlob
 * @returns {Promise<string>}
 */
export async function transcribeAudio(audioBlob) {
  const formData = new FormData();
  // Whisper needs a filename with an extension it supports, like .webm or .wav
  formData.append("file", audioBlob, "audio.webm");
  formData.append("model", "whisper-large-v3");

  try {
    const response = await fetch(GROQ_AUDIO_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${GROQ_API_KEY}`,
      },
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Groq API Error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.text.trim();
  } catch (error) {
    console.error("Error transcribing audio with Groq:", error);
    throw error;
  }
}

/**
 * Generate qualitative feedback using Groq LLM based on transcript and prompt.
 * @param {string} transcript The user's speech transcript
 * @param {string} prompt The original drill prompt
 * @returns {Promise<string>}
 */
export async function generateFeedback(transcript, prompt) {
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
    const response = await fetch(GROQ_CHAT_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${GROQ_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [{ role: "system", content: systemPrompt }],
        temperature: 0.5,
        max_tokens: 150,
      }),
    });

    if (!response.ok) {
      throw new Error(`Groq API Error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.choices[0].message.content.trim();
  } catch (error) {
    console.error("Error generating feedback with Groq:", error);
    return "Unable to generate feedback at this time. Keep practicing!";
  }
}

/**
 * Generate qualitative feedback using Groq LLM for the Level Explain drill.
 * @param {string} transcript1 Phase 1 transcript (High-Schooler)
 * @param {string} transcript2 Phase 2 transcript (Expert)
 * @param {string} prompt The original drill prompt (concept to explain)
 * @returns {Promise<string>}
 */
export async function generateLevelExplainFeedback(transcript1, transcript2, prompt) {
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
    const response = await fetch(GROQ_CHAT_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${GROQ_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [{ role: "system", content: systemPrompt }],
        temperature: 0.5,
        max_tokens: 200,
      }),
    });

    if (!response.ok) {
      throw new Error(`Groq API Error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.choices[0].message.content.trim();
  } catch (error) {
    console.error("Error generating Level Explain feedback with Groq:", error);
    return "Unable to generate comparison feedback at this time. Keep practicing!";
  }
}
