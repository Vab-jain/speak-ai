import { describe, it, expect } from 'vitest';
import { generateSession, DRILL_TYPES } from '../sessionEngine';

describe('sessionEngine', () => {
  describe('generateSession', () => {
    it('generates 3 drills for a 10-minute session', () => {
      const drills = generateSession(10, 'general');
      expect(drills.length).toBe(3);
    });

    it('generates 5 drills for a 15-minute session and sets correct durations', () => {
      const drills = generateSession(15, 'technical');
      expect(drills.length).toBe(5);
      
      const shadowDrill = drills.find(d => d.type === DRILL_TYPES.SHADOW);
      if (shadowDrill) {
        expect(shadowDrill.durationSeconds).toBe(90);
      }
    });

    it('does not repeat drill types in a session', () => {
      const drills = generateSession(15, 'general');
      const types = drills.map(d => d.type);
      const uniqueTypes = new Set(types);
      expect(uniqueTypes.size).toBe(types.length);
    });

    it('handles edge case where requested drills exceed available types', () => {
      // Currently we have 5 types, so asking for 15 minutes (5 drills) is exactly the limit.
      // If we hypothetically asked for a 30 minute session (10 drills), it should cap at available types.
      const drills = generateSession(30, 'technical');
      const availableTypesCount = Object.keys(DRILL_TYPES).length;
      expect(drills.length).toBeLessThanOrEqual(availableTypesCount);
    });
  });
});
