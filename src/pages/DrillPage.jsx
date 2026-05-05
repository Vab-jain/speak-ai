import { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

import { useSettings } from '../context/SettingsContext';
import { generateSession, swapDrill, removeDrill, DRILL_TYPES } from '../utils/sessionEngine';
import { generatePrompt } from '../utils/promptGenerator';
import { evaluateDrill } from '../utils/evaluationEngine';
import { saveSession } from '../utils/progressStore';
import { transcribeAudio } from '../utils/groqClient';

import { useDrillTimer } from '../hooks/useDrillTimer';
import { useLiveTranscript } from '../hooks/useLiveTranscript';
import { useAudioRecorder } from '../hooks/useAudioRecorder';

import DrillTimer from '../components/DrillTimer';
import LiveTranscriptBox from '../components/LiveTranscriptBox';
import MiniStatsCard from '../components/MiniStatsCard';
import SessionSummary from '../components/SessionSummary';
import SessionPreview from '../components/SessionPreview';
import DrillPlaceholder from '../components/DrillPlaceholder';
import { XCircle, ChevronRight } from 'lucide-react';

// Helper to parse query params
function useQuery() {
  return new URLSearchParams(useLocation().search);
}

const STAGES = {
  PREVIEW: 'PREVIEW',
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
  const [stage, setStage] = useState(STAGES.PREVIEW);
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
    const initializeSession = async () => {
      const duration = settings.durationPreference || 10;
      const plan = generateSession(duration, queryMode);
      
      // Generate prompts for all drills initially for the preview
      const planWithPrompts = await Promise.all(plan.map(async drill => ({
        ...drill,
        prompt: await generatePrompt(
          drill.type, 
          queryMode, 
          queryMode === 'technical' ? settings.technicalTopics : settings.generalTopics
        )
      })));

      setSessionPlan(planWithPrompts);
    };
    initializeSession();
  }, []);

  const handleSwap = async (drillId) => {
    const newPlan = swapDrill(sessionPlan, drillId, queryMode);
    // Regenerate prompt for the swapped drill
    const updatedPlan = await Promise.all(newPlan.map(async d => {
      if (d.id === drillId) {
        return {
          ...d,
          prompt: await generatePrompt(
            d.type, 
            queryMode, 
            queryMode === 'technical' ? settings.technicalTopics : settings.generalTopics
          )
        };
      }
      return d;
    }));
    setSessionPlan(updatedPlan);
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
    const audioBlob = await recorder.stop(); // We capture this even if we don't upload it yet
    
    let finalTranscript = transcript.transcript;
    if (audioBlob) {
      try {
        finalTranscript = await transcribeAudio(audioBlob);
      } catch (err) {
        console.error("Whisper transcription failed, using live transcript", err);
      }
    }

    // Evaluate metrics using the final transcript
    const fillerWords = settings.fillerWords; // Defined in SettingsContext defaults
    const metrics = evaluateDrill(
      finalTranscript, 
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
  }, [transcript, recorder, currentDrillPlan, currentPrompt, settings.fillerWords]);

  // Auto-transition when timer ends
  useEffect(() => {
    if (stage === STAGES.ACTIVE && !timer.isRunning && timer.timeLeft === 0) {
      // Defer to next tick to avoid React warning about setState in effect body
      const timeout = setTimeout(() => {
        handleDrillComplete();
      }, 0);
      return () => clearTimeout(timeout);
    }
  }, [timer.isRunning, timer.timeLeft, stage, handleDrillComplete]);

  const startDrill = async () => {
    setStage(STAGES.ACTIVE);
    transcript.start();
    await recorder.start();
    // Use the planned duration, default to 60 for OneMinuteSpeech
    timer.start(currentDrillPlan?.durationSeconds || 60);
  };



  const nextDrill = () => {
    const nextIndex = currentDrillIndex + 1;
    if (nextIndex < sessionPlan.length) {
      // Setup next drill
      setCurrentDrillIndex(nextIndex);
      setCurrentPrompt(sessionPlan[nextIndex].prompt);
      
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

  // Safe checks while initializing
  if (sessionPlan.length === 0) {
    return <div className="p-8 text-center mt-20 text-text-muted">Initializing session...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto px-6 pt-12 flex flex-col items-center">
      
      {/* Header (hidden in summary and preview) */}
      {stage !== STAGES.SUMMARY && stage !== STAGES.PREVIEW && (
        <div className="w-full flex justify-between items-center mb-8">
          <div className="flex flex-col">
            <div className="text-sm font-semibold text-text-muted uppercase tracking-wider flex items-center gap-2">
              {queryMode} Mode
              <ChevronRight size={14} />
              <span className="text-accent-primary">{currentDrillPlan?.label}</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-sm font-semibold text-accent-primary uppercase tracking-wider bg-accent-primary/10 px-3 py-1 rounded-full">
              Drill {currentDrillIndex + 1} of {sessionPlan.length}
            </div>
            <button 
              onClick={endSessionEarly}
              className="p-2 text-text-muted hover:text-danger hover:bg-danger/10 rounded-lg transition-colors"
              title="End Session Early"
            >
              <XCircle size={20} />
            </button>
          </div>
        </div>
      )}

      <AnimatePresence mode="wait">
        
        {/* STAGE: PREVIEW */}
        {stage === STAGES.PREVIEW && (
          <motion.div key="preview" className="w-full">
            <SessionPreview 
              drills={sessionPlan} 
              onStart={startSession}
              onSwap={handleSwap}
              onRemove={handleRemove}
            />
          </motion.div>
        )}

        {/* STAGE: PROMPT */}
        {stage === STAGES.PROMPT && (
          <motion.div 
            key="prompt"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="flex flex-col items-center text-center w-full mt-4"
          >
            {(currentDrillPlan?.type === DRILL_TYPES.ONE_MINUTE_SPEECH || 
              currentDrillPlan?.type === DRILL_TYPES.SHADOW ||
              currentDrillPlan?.type === DRILL_TYPES.KEYWORDS) ? (
              <>
                <span className="text-text-secondary uppercase tracking-widest font-semibold mb-4 text-sm">
                  {currentDrillPlan?.type === DRILL_TYPES.ONE_MINUTE_SPEECH ? 'Your Topic' : 
                   currentDrillPlan?.type === DRILL_TYPES.SHADOW ? 'Shadow This' : 'Rapid-Fire Keywords'}
                </span>
                <h1 className={`font-extrabold mb-12 leading-tight ${
                  (currentDrillPlan?.type === DRILL_TYPES.SHADOW || currentDrillPlan?.type === DRILL_TYPES.KEYWORDS)
                    ? 'text-3xl md:text-4xl text-left bg-white/5 p-8 rounded-2xl border border-white/10' 
                    : 'text-5xl md:text-6xl text-center'
                }`}>
                  {currentPrompt}
                </h1>
                <p className="text-text-secondary mb-12 max-w-lg">
                  {currentDrillPlan?.type === DRILL_TYPES.ONE_MINUTE_SPEECH 
                    ? `Take a moment to gather your thoughts. You will speak for ${currentDrillPlan.durationSeconds} seconds about this topic.`
                    : currentDrillPlan?.type === DRILL_TYPES.SHADOW
                    ? `Read the text above, then speak it back naturally. You can repeat it exactly or paraphrase. You have ${currentDrillPlan.durationSeconds} seconds.`
                    : `Quickly list as many technical terms and keywords as possible related to the topic above. Accuracy and speed matter. You have ${currentDrillPlan.durationSeconds} seconds.`}
                </p>
                <button 
                  onClick={startDrill}
                  className="btn btn-primary px-12 py-5 text-xl shadow-[0_0_30px_rgba(139,92,246,0.3)] hover:shadow-[0_0_40px_rgba(139,92,246,0.5)] transition-all"
                >
                  Start Speaking
                </button>
              </>
            ) : (
              <DrillPlaceholder 
                drillType={currentDrillPlan?.label} 
                onSwap={() => handleSwap(currentDrillPlan.id)} 
              />
            )}
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
