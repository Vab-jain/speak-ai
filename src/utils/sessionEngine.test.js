import { describe, it, expect } from 'vitest';
import { generateSession, DRILL_TYPES } from './sessionEngine';

describe('sessionEngine', () => {
  it('should generate SHADOW drills with a 90 second duration', () => {
    // Force a SHADOW drill by mocking Math.random
    // SHADOW is at index 1 of types array
    const spy = vi.spyOn(Math, 'random').mockReturnValue(0.3); // floor(0.3 * 5) = 1
    const session = generateSession(1, 'technical');
    expect(session[0].type).toBe(DRILL_TYPES.SHADOW);
    expect(session[0].durationSeconds).toBe(90);
    spy.mockRestore();
  });

  it('should include SHADOW drills in the rotation', () => {
    // Generate many sessions to ensure we see SHADOW at least once (probabilistic but safe enough for 100 trials)
    const allTypes = new Set();
    for (let i = 0; i < 50; i++) {
      const session = generateSession(15, 'technical');
      session.forEach(d => allTypes.add(d.type));
    }
    expect(allTypes.has(DRILL_TYPES.SHADOW)).toBe(true);
  });
});
