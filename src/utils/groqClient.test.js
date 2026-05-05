import { describe, it, expect, vi, beforeEach } from 'vitest';
import { generateGroqPrompt, generateFeedback } from './groqClient';

describe('groqClient', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({
          choices: [{ message: { content: 'This is a test prompt.' } }]
        }),
      })
    ));
    vi.clearAllMocks();
  });

  it('should request a rich sentence or short paragraph for SHADOW drills', async () => {
    await generateGroqPrompt('SHADOW', 'technical', ['AI']);
    
    const fetchArgs = vi.mocked(fetch).mock.calls[0];
    const body = JSON.parse(fetchArgs[1].body);
    const systemPrompt = body.messages[0].content;
    
    expect(systemPrompt).toMatch(/paragraph/i);
  });

  it('should request evaluation of fluency and paraphrasing for SHADOW drills', async () => {
    await generateFeedback('The user repeated the sentence with good clarity.', 'Shadow this: The quick brown fox jumps over the lazy dog.');
    
    const fetchArgs = vi.mocked(fetch).mock.calls[0]; // First call since clearAllMocks
    const body = JSON.parse(fetchArgs[1].body);
    const systemPrompt = body.messages[0].content;
    
    expect(systemPrompt).toMatch(/fluency/i);
    expect(systemPrompt).toMatch(/paraphrasing/i);
  });
});
