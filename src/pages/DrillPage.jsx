import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

import { DRILL_TYPES } from '../utils/sessionEngine';
import { useDrillOrchestrator, STAGES } from '../hooks/useDrillOrchestrator';

import DrillTimer from '../components/DrillTimer';
import LiveTranscriptBox from '../components/LiveTranscriptBox';
import MiniStatsCard from '../components/MiniStatsCard';
import SessionSummary from '../components/SessionSummary';
import SessionPreview from '../components/SessionPreview';

import { XCircle, ChevronRight } from 'lucide-react';

// Helper to parse query params
function useQuery() {
  return new URLSearchParams(useLocation().search);
}

const DrillPage = () => {
  const query = useQuery();
  const navigate = useNavigate();
  const queryMode = query.get('mode') || 'technical';
  
  const orchestrator = useDrillOrchestrator(queryMode);
  const {
    stage,
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
  } = orchestrator;

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
            <>
                <span className="text-text-secondary uppercase tracking-widest font-semibold mb-4 text-sm">
                  {currentDrillPlan?.type === DRILL_TYPES.ONE_MINUTE_SPEECH ? 'Your Topic' : 
                   currentDrillPlan?.type === DRILL_TYPES.SHADOW ? 'Shadow This' : 
                   currentDrillPlan?.type === DRILL_TYPES.LEVEL_EXPLAIN ? 'Level Explain' : 
                   currentDrillPlan?.type === DRILL_TYPES.FILLER_RESET ? 'Filler Reset' : 'Rapid-Fire Keywords'}
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
                    : currentDrillPlan?.type === DRILL_TYPES.LEVEL_EXPLAIN
                    ? `You'll explain this concept twice. First to a high-school student (simple), then to an expert (technical). Each phase gets ${Math.floor((currentDrillPlan.durationSeconds || 120)/2)} seconds.`
                    : currentDrillPlan?.type === DRILL_TYPES.FILLER_RESET
                    ? `Speak without using any filler words. In Easy mode, manually reset if you catch yourself. In Hard mode, the AI auto-resets you.`
                    : `Quickly list as many technical terms and keywords as possible related to the topic above. Accuracy and speed matter. You have ${currentDrillPlan.durationSeconds} seconds.`}
                </p>

                {currentDrillPlan?.type === DRILL_TYPES.FILLER_RESET && (
                  <div className="flex gap-8 mb-12 bg-white/5 p-6 rounded-2xl border border-white/10">
                    <div className="flex flex-col items-start gap-2">
                      <label className="text-xs uppercase font-bold text-text-muted">Difficulty</label>
                      <div className="flex gap-2">
                        <button onClick={() => setFillerDifficulty('easy')} className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${fillerDifficulty === 'easy' ? 'bg-accent-primary text-white' : 'bg-white/10 hover:bg-white/20'}`}>Easy</button>
                        <button onClick={() => setFillerDifficulty('hard')} className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${fillerDifficulty === 'hard' ? 'bg-danger text-white' : 'bg-white/10 hover:bg-white/20'}`}>Hard</button>
                      </div>
                    </div>
                    <div className="flex flex-col items-start gap-2">
                      <label className="text-xs uppercase font-bold text-text-muted">Duration</label>
                      <div className="flex gap-2">
                        {[30, 60, 120].map(d => (
                          <button key={d} onClick={() => setFillerDuration(d)} className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${fillerDuration === d ? 'bg-accent-primary text-white' : 'bg-white/10 hover:bg-white/20'}`}>{d}s</button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                <button 
                  onClick={startDrill}
                  className="btn btn-primary px-12 py-5 text-xl shadow-[0_0_30px_rgba(139,92,246,0.3)] hover:shadow-[0_0_40px_rgba(139,92,246,0.5)] transition-all"
                >
                  Start Speaking
                </button>
              </>
          </motion.div>
        )}


        {/* STAGE: ACTIVE */}
        {stage === STAGES.ACTIVE && (
          <motion.div
            key="active"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className={`flex flex-col items-center w-full gap-12 transition-colors duration-300 ${isFlash ? 'bg-danger/20 p-8 rounded-3xl' : ''}`}
          >
            <div className="text-center">
              <span className="text-text-secondary uppercase tracking-widest font-semibold mb-2 block text-sm">
                Speaking About
              </span>
              <h2 className="text-3xl font-bold">{currentPrompt}</h2>
              {currentDrillPlan?.type === DRILL_TYPES.LEVEL_EXPLAIN && (
                <div className="mt-6 text-xl font-bold text-accent-primary bg-accent-primary/10 inline-block px-6 py-3 rounded-xl border border-accent-primary/20">
                  Phase {activePhase}: Explain to {activePhase === 1 ? 'a High-School Student' : 'an Expert'}
                </div>
              )}
              {currentDrillPlan?.type === DRILL_TYPES.FILLER_RESET && (
                <div className="mt-6 text-xl font-bold text-warning bg-warning/10 inline-block px-6 py-3 rounded-xl border border-warning/20">
                  Resets: {resetCount}
                </div>
              )}
            </div>

            {currentDrillPlan?.type === DRILL_TYPES.FILLER_RESET ? (
              <DrillTimer 
                time={countUpTimer.timeElapsed} 
                duration={fillerDuration} 
                progress={countUpTimer.progress} 
                isCountUp={true}
              />
            ) : (
              <DrillTimer 
                time={timer.timeLeft} 
                duration={currentDrillPlan.durationSeconds} 
                progress={timer.progress} 
              />
            )}

            <LiveTranscriptBox 
              transcript={transcript.transcript}
              isListening={transcript.isListening}
            />

            <div className="flex gap-4 mt-4">
              {currentDrillPlan?.type === DRILL_TYPES.FILLER_RESET && fillerDifficulty === 'easy' && (
                <button 
                  onClick={() => {
                    setResetCount(prev => prev + 1);
                    countUpTimer.reset();
                    transcript.reset();
                  }}
                  className="btn bg-warning text-black px-8 py-3 text-sm font-bold hover:brightness-110"
                >
                  I used a filler (Reset)
                </button>
              )}
              <button 
                onClick={handleDrillComplete}
                className="btn btn-secondary px-8 py-3 text-sm hover:border-danger hover:text-danger hover:bg-danger/10"
              >
                End Early
              </button>
            </div>
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
