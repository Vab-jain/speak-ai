import { describe, it, expect } from 'vitest';
import { calculateWPM, countFillers, extractKeywords, DEFAULT_FILLER_WORDS } from '../evaluationEngine';

describe('evaluationEngine', () => {
  describe('calculateWPM', () => {
    it('calculates WPM correctly for normal speech', () => {
      // 150 words in 60 seconds = 150 WPM
      const transcript = Array(150).fill('word').join(' ');
      expect(calculateWPM(transcript, 60)).toBe(150);
    });

    it('handles short durations', () => {
      // 20 words in 10 seconds = 120 WPM
      const transcript = Array(20).fill('word').join(' ');
      expect(calculateWPM(transcript, 10)).toBe(120);
    });

    it('handles zero or negative duration', () => {
      expect(calculateWPM('hello world', 0)).toBe(0);
      expect(calculateWPM('hello world', -5)).toBe(0);
    });

    it('handles empty transcript', () => {
      expect(calculateWPM('', 60)).toBe(0);
      expect(calculateWPM('   ', 60)).toBe(0);
      expect(calculateWPM(null, 60)).toBe(0);
    });
  });

  describe('countFillers', () => {
    it('catches exact filler matches', () => {
      const transcript = 'um I went to the store and uh bought some apples';
      const result = countFillers(transcript);
      expect(result.count).toBe(2);
      expect(result.detected).toContain('um');
      expect(result.detected).toContain('uh');
    });

    it('is case-insensitive', () => {
      const transcript = 'LIKE, Um, literally SO cool.';
      const result = countFillers(transcript);
      expect(result.count).toBe(4);
      expect(result.detected).toContain('like');
      expect(result.detected).toContain('um');
      expect(result.detected).toContain('literally');
      expect(result.detected).toContain('so');
    });

    it('does not flag substrings as false positives', () => {
      const transcript = 'Likewise, a meaningful summery is soothing.';
      const result = countFillers(transcript);
      expect(result.count).toBe(0);
    });

    it('handles multi-word fillers', () => {
      const transcript = 'I went there, you know, because it was sort of close.';
      const result = countFillers(transcript);
      expect(result.count).toBe(2);
      expect(result.detected).toContain('you know');
      expect(result.detected).toContain('sort of');
    });

    it('handles empty transcript', () => {
      expect(countFillers('').count).toBe(0);
      expect(countFillers(null).count).toBe(0);
    });
  });

  describe('extractKeywords', () => {
    it('extracts and counts matching keywords', () => {
      const transcript = 'The microservices architecture uses RAG for data retrieval.';
      const result = extractKeywords(transcript, ['microservices', 'RAG', 'system design']);
      expect(result.count).toBe(2);
      expect(result.matched).toContain('microservices');
      expect(result.matched).toContain('RAG');
      expect(result.matched).not.toContain('system design');
    });

    it('is case-insensitive and strict on word boundaries', () => {
      const transcript = 'ragging is not RAG.';
      const result = extractKeywords(transcript, ['rag']);
      expect(result.count).toBe(1);
    });
  });
});
