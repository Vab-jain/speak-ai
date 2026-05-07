import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSettings } from '../context/SettingsContext';
import { generateSession, swapDrill, removeDrill, DRILL_TYPES } from '../utils/sessionEngine';
import { generatePrompt, transcribeAudio } from '../utils/groqClient';
import { evaluateDrill, countFillers } from '../utils/evaluationEngine';
import { saveSession } from '../utils/progressStore';

import { useDrillTimer } from './useDrillTimer';
import { useCountUpTimer } from './useCountUpTimer';
import { useLiveTranscript } from './useLiveTranscript';
import { useAudioRecorder } from './useAudioRecorder';

export const STAGES = {
  PREVIEW: 'PREVIEW',
  PROMPT: 'PROMPT',
  ACTIVE: 'ACTIVE',
  STATS: 'STATS',
  SUMMARY: 'SUMMARY',
};

export function useDrillOrchestrator(queryMode) {
  const navigate = useNavigate();
  const { settings } = useSettings();

  const [sessionPlan, setSessionPlan] = useState([]);
  const [currentDrillIndex, setCurrentDrillIndex] = useState(0);
  const [stage, setStage] = useState(STAGES.PREVIEW);
  const [completedDrills, setCompletedDrills] = useState([]);
  
  // Phase state for multi-phase drills like Level Explain
  const [activePhase, setActivePhase] = useState(1);
  const [phase1Data, setPhase1Data] = useState(null);

  // State for Filler Reset drill
  const [fillerDifficulty, setFillerDifficulty] = useState('easy');
  const [fillerDuration, setFillerDuration] = useState(60);
  const [resetCount, setResetCount] = useState(0);
  const [isFlash, setIsFlash] = useState(false);

  const [currentPrompt, setCurrentPrompt] = useState('');
  const [currentMetrics, setCurrentMetrics] = useState(null);

  // Hooks
  const timer = useDrillTimer();
  const countUpTimer = useCountUpTimer();
  const transcript = useLiveTranscript();
  const recorder = useAudioRecorder();

  // Initialize session on mount
  useEffect(() => {
    const initializeSession = async () => {
      const duration = settings.durationPreference || 10;
      const plan = generateSession(duration, queryMode);
      
      const groqOpts = { apiKey: settings.groqApiKey };
      const planWithPrompts = await Promise.all(plan.map(async drill => ({
        ...drill,
        prompt: await generatePrompt(
          drill.type, 
          queryMode, 
          queryMode === 'technical' ? settings.technicalTopics : settings.generalTopics,
          groqOpts
        )
      })));

      setSessionPlan(planWithPrompts);
    };
    initializeSession();
  }, [queryMode, settings.durationPreference, settings.groqApiKey, settings.technicalTopics, settings.generalTopics]);

  const handleSwap = async (drillId) => {
    const index = sessionPlan.findIndex(d => d.id === drillId);
    const newPlan = swapDrill(sessionPlan, drillId, queryMode);
    const swappedDrill = newPlan[index];
    if (swappedDrill) {
      const prompt = await generatePrompt(
        swappedDrill.type,
        queryMode,
        queryMode === 'technical' ? settings.technicalTopics : settings.generalTopics,
        { apiKey: settings.groqApiKey }
      );
      newPlan[index] = { ...swappedDrill, prompt };
    }
    setSessionPlan([...newPlan]);
  };

  const handleRemove = (drillId) => {
    setSessionPlan(removeDrill(sessionPlan, drillId));
  };

  const startSession = () => {
    if (sessionPlan.length > 0) {
      setCurrentDrillIndex(0);
      setCurrentPrompt(sessionPlan[0].prompt);
      setStage(STAGES.PROMPT);
    }
  };

  const currentDrillPlan = sessionPlan[currentDrillIndex];

  const handleDrillComplete = useCallback(async () => {
    transcript.stop();
    const audioBlob = await recorder.stop();
    
    let finalTranscript = transcript.transcript;
    if (audioBlob) {
      try {
        finalTranscript = await transcribeAudio(audioBlob, { apiKey: settings.groqApiKey });
      } catch (err) {
        console.error("Whisper transcription failed, using live transcript", err);
      }
    }

    const fillerWords = settings.fillerWords;
    const isLevelExplain = currentDrillPlan?.type === DRILL_TYPES.LEVEL_EXPLAIN;
    const isFillerReset = currentDrillPlan?.type === DRILL_TYPES.FILLER_RESET;
    const phaseDuration = isLevelExplain 
      ? Math.floor((currentDrillPlan?.durationSeconds || 120) / 2)
      : isFillerReset ? fillerDuration : (currentDrillPlan?.durationSeconds || 60);

    const metrics = evaluateDrill(finalTranscript, phaseDuration, fillerWords);

    if (isLevelExplain && activePhase === 1) {
      setPhase1Data({
        transcript: metrics.transcript,
        metrics: { wpm: metrics.wpm, fillerCount: metrics.fillerCount },
        detectedFillers: metrics.detectedFillers,
        audioBlob
      });
      setActivePhase(2);
      transcript.reset();
      transcript.start();
      await recorder.start();
      timer.start(phaseDuration);
      return; 
    }

    let finalDrillRecord;

    if (isLevelExplain && activePhase === 2) {
      const combinedWpm = Math.round((phase1Data.metrics.wpm + metrics.wpm) / 2);
      const combinedFillerCount = phase1Data.metrics.fillerCount + metrics.fillerCount;
      const combinedDetectedFillers = [...phase1Data.detectedFillers, ...metrics.detectedFillers];
      
      finalDrillRecord = {
        id: currentDrillPlan.id,
        type: currentDrillPlan.type,
        mode: currentDrillPlan.mode,
        prompt: currentPrompt,
        transcript: null, 
        transcript1: phase1Data.transcript,
        transcript2: metrics.transcript,
        metrics: { wpm: combinedWpm, fillerCount: combinedFillerCount },
        detectedFillers: combinedDetectedFillers,
        audioBlob1: phase1Data.audioBlob,
        audioBlob2: audioBlob,
      };
      setCurrentMetrics({
        wpm: combinedWpm,
        fillerCount: combinedFillerCount,
        detectedFillers: combinedDetectedFillers
      });
    } else {
      finalDrillRecord = {
        id: currentDrillPlan.id,
        type: currentDrillPlan.type,
        mode: currentDrillPlan.mode,
        prompt: currentPrompt,
        transcript: metrics.transcript,
        metrics: { wpm: metrics.wpm, fillerCount: metrics.fillerCount },
        detectedFillers: metrics.detectedFillers,
        audioBlob,
        ...(isFillerReset && { resetCount, fillerDifficulty, targetDuration: fillerDuration })
      };
      setCurrentMetrics(metrics);
    }

    setCompletedDrills(prev => [...prev, finalDrillRecord]);
    setStage(STAGES.STATS);
  }, [transcript, recorder, currentDrillPlan, currentPrompt, settings.fillerWords, settings.groqApiKey, activePhase, phase1Data, timer, fillerDuration, fillerDifficulty, resetCount]);

  // Auto-transition when timer ends
  useEffect(() => {
    if (stage === STAGES.ACTIVE) {
      if (currentDrillPlan?.type === DRILL_TYPES.FILLER_RESET) {
        if (!countUpTimer.isRunning && countUpTimer.timeElapsed >= fillerDuration) {
          const timeout = setTimeout(() => handleDrillComplete(), 0);
          return () => clearTimeout(timeout);
        }
      } else {
        if (!timer.isRunning && timer.timeLeft === 0) {
          const timeout = setTimeout(() => handleDrillComplete(), 0);
          return () => clearTimeout(timeout);
        }
      }
    }
  }, [timer.isRunning, timer.timeLeft, countUpTimer.isRunning, countUpTimer.timeElapsed, stage, currentDrillPlan, fillerDuration, handleDrillComplete]);

  // Hard mode auto-reset for FILLER_RESET
  useEffect(() => {
    if (
      stage === STAGES.ACTIVE &&
      currentDrillPlan?.type === DRILL_TYPES.FILLER_RESET &&
      fillerDifficulty === 'hard' &&
      transcript.transcript
    ) {
      const { count } = countFillers(transcript.transcript, settings.fillerWords);
      if (count > 0) {
        setResetCount(prev => prev + 1);
        setIsFlash(true);
        setTimeout(() => setIsFlash(false), 500);
        transcript.reset();
        countUpTimer.reset();
      }
    }
  }, [transcript.transcript, stage, currentDrillPlan, fillerDifficulty, settings.fillerWords, countUpTimer, transcript]);

  const startDrill = async () => {
    setStage(STAGES.ACTIVE);
    setActivePhase(1);
    setPhase1Data(null);
    setResetCount(0);
    transcript.start();
    await recorder.start();
    
    if (currentDrillPlan?.type === DRILL_TYPES.FILLER_RESET) {
      countUpTimer.start(fillerDuration);
    } else {
      const isLevelExplain = currentDrillPlan?.type === DRILL_TYPES.LEVEL_EXPLAIN;
      const duration = isLevelExplain 
        ? Math.floor((currentDrillPlan?.durationSeconds || 120) / 2)
        : (currentDrillPlan?.durationSeconds || 60);
      timer.start(duration);
    }
  };

  const nextDrill = () => {
    const nextIndex = currentDrillIndex + 1;
    if (nextIndex < sessionPlan.length) {
      setCurrentDrillIndex(nextIndex);
      setCurrentPrompt(sessionPlan[nextIndex].prompt);
      timer.reset();
      transcript.reset();
      setCurrentMetrics(null);
      setStage(STAGES.PROMPT);
    } else {
      setStage(STAGES.SUMMARY);
    }
  };

  const endSessionEarly = () => {
    if (completedDrills.length > 0) {
      setStage(STAGES.SUMMARY);
    } else {
      navigate('/');
    }
  };

  const finishSession = (sessionDataWithRating) => {
    saveSession({
      date: new Date().toISOString(),
      mode: queryMode,
      durationMinutes: settings.durationPreference,
      drills: sessionDataWithRating.drills,
      selfRating: sessionDataWithRating.selfRating
    });
    navigate('/');
  };

  return {
    stage,
    currentDrillIndex,
    currentDrillPlan,
    currentPrompt,
    sessionPlan,
    completedDrills,
    currentMetrics,
    timer,
    countUpTimer,
    transcript,
    activePhase,
    fillerDifficulty,
    setFillerDifficulty,
    fillerDuration,
    setFillerDuration,
    resetCount,
    setResetCount,
    isFlash,
    startSession,
    startDrill,
    handleSwap,
    handleRemove,
    handleDrillComplete,
    nextDrill,
    endSessionEarly,
    finishSession,
  };
}
