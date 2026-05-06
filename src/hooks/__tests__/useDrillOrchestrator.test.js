import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useDrillOrchestrator, STAGES } from '../useDrillOrchestrator';
import * as SettingsContext from '../../context/SettingsContext';

// Mock dependencies
vi.mock('react-router-dom', () => ({
  useNavigate: () => vi.fn(),
}));
vi.mock('../../context/SettingsContext', () => ({
  useSettings: vi.fn(),
}));
vi.mock('../useDrillTimer', () => ({
  useDrillTimer: () => ({ start: vi.fn(), reset: vi.fn(), isRunning: false, timeLeft: 0 }),
}));
vi.mock('../useCountUpTimer', () => ({
  useCountUpTimer: () => ({ start: vi.fn(), reset: vi.fn(), isRunning: false, timeElapsed: 0 }),
}));
vi.mock('../useLiveTranscript', () => ({
  useLiveTranscript: () => ({ start: vi.fn(), stop: vi.fn(), reset: vi.fn(), transcript: '' }),
}));
vi.mock('../useAudioRecorder', () => ({
  useAudioRecorder: () => ({ start: vi.fn(), stop: vi.fn() }),
}));

describe('useDrillOrchestrator', () => {
  beforeEach(() => {
    vi.mocked(SettingsContext.useSettings).mockReturnValue({
      settings: {
        durationPreference: 10,
        groqApiKey: 'test-key',
        technicalTopics: ['React'],
        generalTopics: ['Life'],
        fillerWords: ['um'],
      }
    });
  });

  it('initializes in PREVIEW stage', () => {
    const { result } = renderHook(() => useDrillOrchestrator('technical'));
    
    expect(result.current.stage).toBe(STAGES.PREVIEW);
    expect(result.current.sessionPlan).toBeDefined();
    expect(result.current.completedDrills).toEqual([]);
    expect(result.current.currentMetrics).toBeNull();
  });
});
