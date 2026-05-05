import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

import { useSettings } from '../context/SettingsContext';
import { generateSession } from '../utils/sessionEngine';
import { generateOneMinuteSpeechPrompt } from '../utils/promptGenerator';
import { evaluateDrill } from '../utils/evaluationEngine';
import { saveSession } from '../utils/progressStore';

import { useDrillTimer } from '../hooks/useDrillTimer';
import { useLiveTranscript } from '../hooks/useLiveTranscript';
import { useAudioRecorder } from '../hooks/useAudioRecorder';

import DrillTimer from '../components/DrillTimer';
import LiveTranscriptBox from '../components/LiveTranscriptBox';
import MiniStatsCard from '../components/MiniStatsCard';
import SessionSummary from '../components/SessionSummary';

// Helper to parse query params
function useQuery() {
  return new URLSearchParams(useLocation().search);
}

const STAGES = {
  PROMPT: 'PROMPT',
  ACTIVE: 'ACTIVE',
  STATS: 'STATS',
  SUMMARY: 'SUMMARY',
};

const DrillPage = () => {
  const query = useQuery();
  const navigate = useNavigate();
  const { settings } = useSettings();

  const queryMode = query.get('mode') || 'technical';
  
  const [sessionPlan, setSessionPlan] = useState([]);
  const [currentDrillIndex, setCurrentDrillIndex] = useState(0);
  const [stage, setStage] = useState(STAGES.PROMPT);
  const [completedDrills, setCompletedDrills] = useState([]);

  // State for the current drill
  const [currentPrompt, setCurrentPrompt] = useState('');
  const [currentMetrics, setCurrentMetrics] = useState(null);

  // Hooks
  const timer = useDrillTimer();
  const transcript = useLiveTranscript();
  const recorder = useAudioRecorder();

  // Initialize session on mount
  useEffect(() => {
    const duration = settings.durationPreference || 10;
    const plan = generateSession(duration, queryMode);
    setSessionPlan(plan);
    // Initialize first prompt
    loadPromptForDrill(plan[0], queryMode);
  }, []);

  const loadPromptForDrill = (drillPlan, mode) => {
    const topics = mode === 'technical' ? settings.technicalTopics : settings.generalTopics;
    const prompt = generateOneMinuteSpeechPrompt(mode, topics);
    setCurrentPrompt(prompt);
  };

  const currentDrillPlan = sessionPlan[currentDrillIndex];

  // Auto-transition when timer ends
  useEffect(() => {
    if (stage === STAGES.ACTIVE && !timer.isRunning && timer.timeLeft === 0) {
      handleDrillComplete();
    }
  }, [timer.isRunning, timer.timeLeft, stage]);

  const startDrill = async () => {
    setStage(STAGES.ACTIVE);
    transcript.start();
    await recorder.start();
    // Use the planned duration, default to 60 for OneMinuteSpeech
    timer.start(currentDrillPlan?.durationSeconds || 60);
  };

  const handleDrillComplete = async () => {
    transcript.stop();
    const audioBlob = await recorder.stop(); // We capture this even if we don't upload it yet
    
    // Evaluate metrics using the local Web Speech API transcript
    const fillerWords = settings.fillerWords; // Defined in SettingsContext defaults
    const metrics = evaluateDrill(
      transcript.transcript, 
      currentDrillPlan?.durationSeconds || 60,
      fillerWords
    );

    setCurrentMetrics(metrics);

    // Save completed drill to state
    setCompletedDrills(prev => [
      ...prev,
      {
        id: currentDrillPlan.id,
        type: currentDrillPlan.type,
        mode: currentDrillPlan.mode,
        prompt: currentPrompt,
        transcript: metrics.transcript,
        metrics: {
          wpm: metrics.wpm,
          fillerCount: metrics.fillerCount
        },
        detectedFillers: metrics.detectedFillers,
        audioBlob, // Keep reference for future use if needed
      }
    ]);

    setStage(STAGES.STATS);
  };

  const nextDrill = () => {
    const nextIndex = currentDrillIndex + 1;
    if (nextIndex < sessionPlan.length) {
      // Setup next drill
      setCurrentDrillIndex(nextIndex);
      loadPromptForDrill(sessionPlan[nextIndex], queryMode);
      
      // Reset state for new drill
      timer.reset();
      transcript.reset();
      setCurrentMetrics(null);
      setStage(STAGES.PROMPT);
    } else {
      // Session is over
      setStage(STAGES.SUMMARY);
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

  // Safe checks while initializing
  if (sessionPlan.length === 0) {
    return <div className="p-8 text-center mt-20 text-text-muted">Initializing session...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto px-6 pt-12 flex flex-col items-center">
      
      {/* Header (hidden in summary) */}
      {stage !== STAGES.SUMMARY && (
        <div className="w-full flex justify-between items-center mb-12">
          <div className="text-sm font-semibold text-text-muted uppercase tracking-wider">
            {queryMode} Mode
          </div>
          <div className="text-sm font-semibold text-accent-primary uppercase tracking-wider bg-accent-primary/10 px-3 py-1 rounded-full">
            Drill {currentDrillIndex + 1} of {sessionPlan.length}
          </div>
        </div>
      )}

      <AnimatePresence mode="wait">
        
        {/* STAGE: PROMPT */}
        {stage === STAGES.PROMPT && (
          <motion.div 
            key="prompt"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="flex flex-col items-center text-center w-full mt-10"
          >
            <span className="text-text-secondary uppercase tracking-widest font-semibold mb-4 text-sm">
              Your Topic
            </span>
            <h1 className="text-5xl md:text-6xl font-extrabold mb-12 leading-tight">
              {currentPrompt}
            </h1>
            <p className="text-text-secondary mb-12 max-w-lg">
              Take a moment to gather your thoughts. You will speak for {currentDrillPlan.durationSeconds} seconds about this topic.
            </p>
            <button 
              onClick={startDrill}
              className="btn btn-primary px-12 py-5 text-xl shadow-[0_0_30px_rgba(139,92,246,0.3)] hover:shadow-[0_0_40px_rgba(139,92,246,0.5)] transition-all"
            >
              Start Speaking
            </button>
          </motion.div>
        )}

        {/* STAGE: ACTIVE */}
        {stage === STAGES.ACTIVE && (
          <motion.div
            key="active"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="flex flex-col items-center w-full gap-12"
          >
            <div className="text-center">
              <span className="text-text-secondary uppercase tracking-widest font-semibold mb-2 block text-sm">
                Speaking About
              </span>
              <h2 className="text-3xl font-bold">{currentPrompt}</h2>
            </div>

            <DrillTimer 
              timeLeft={timer.timeLeft} 
              duration={currentDrillPlan.durationSeconds} 
              progress={timer.progress} 
            />

            <LiveTranscriptBox 
              transcript={transcript.transcript}
              isListening={transcript.isListening}
            />

            <button 
              onClick={handleDrillComplete}
              className="btn btn-secondary px-8 py-3 text-sm mt-4 hover:border-danger hover:text-danger hover:bg-danger/10"
            >
              End Early
            </button>
          </motion.div>
        )}

        {/* STAGE: STATS */}
        {stage === STAGES.STATS && (
          <motion.div
            key="stats"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="w-full mt-10"
          >
            <MiniStatsCard 
              wpm={currentMetrics?.wpm || 0}
              fillerCount={currentMetrics?.fillerCount || 0}
              detectedFillers={currentMetrics?.detectedFillers || []}
              isLastDrill={currentDrillIndex === sessionPlan.length - 1}
              onNext={nextDrill}
            />
          </motion.div>
        )}

        {/* STAGE: SUMMARY */}
        {stage === STAGES.SUMMARY && (
          <motion.div
            key="summary"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="w-full"
          >
            <SessionSummary 
              sessionData={{ drills: completedDrills }} 
              onSave={finishSession}
            />
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
};

export default DrillPage;
