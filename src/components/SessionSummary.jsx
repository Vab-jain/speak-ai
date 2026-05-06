import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Save, ChevronDown, ChevronUp } from 'lucide-react';
import { generateFeedback, generateLevelExplainFeedback, generateFillerResetFeedback } from '../utils/groqClient';
import { DRILL_TYPES } from '../utils/sessionEngine';
import { useSettings } from '../context/SettingsContext';

const DrillAccordion = ({ drill, index }) => {
  const { settings } = useSettings();
  const [isOpen, setIsOpen] = useState(index === 0);
  const [feedback, setFeedback] = useState(null);
  const [isLoadingFeedback, setIsLoadingFeedback] = useState(false);

  useEffect(() => {
    const isLevelExplain = drill.type === DRILL_TYPES.LEVEL_EXPLAIN;
    const isFillerReset = drill.type === DRILL_TYPES.FILLER_RESET;
    const hasContent = isLevelExplain ? (drill.transcript1 && drill.transcript2) : drill.transcript;

    if (isOpen && !feedback && hasContent) {
      const fetchFeedback = async () => {
        setIsLoadingFeedback(true);
        try {
          let res;
          const opts = { apiKey: settings.groqApiKey };
          if (isLevelExplain) {
            res = await generateLevelExplainFeedback(drill.transcript1, drill.transcript2, drill.prompt, opts);
          } else if (isFillerReset) {
            res = await generateFillerResetFeedback(drill.transcript, drill.resetCount, drill.fillerDifficulty, drill.targetDuration, opts);
          } else {
            res = await generateFeedback(drill.transcript, drill.prompt, opts);
          }
          setFeedback(res);
        } catch (err) {
          setFeedback("Unable to generate feedback.");
          console.error(err);
        } finally {
          setIsLoadingFeedback(false);
        }
      };
      fetchFeedback();
    }
  }, [isOpen, feedback, drill, settings.groqApiKey]);

  return (
    <div className="border border-border rounded-xl overflow-hidden mb-4 bg-white/5">
      <button 
        className="w-full flex items-center justify-between p-4 bg-white/5 hover:bg-white/10 transition-colors"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex flex-col items-start">
          <span className="text-xs text-text-muted font-semibold uppercase tracking-wider mb-1">
            Drill {index + 1}
          </span>
          <span className="font-bold text-lg">{drill.prompt}</span>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3 text-sm font-medium text-text-secondary">
            {drill.type === DRILL_TYPES.FILLER_RESET && (
              <>
                <span className={drill.resetCount > 0 ? "text-warning" : "text-success"}>
                  {drill.resetCount} Resets ({drill.fillerDifficulty})
                </span>
                <span>•</span>
              </>
            )}
            <span>{drill.metrics.wpm} WPM</span>
            <span>•</span>
            <span className={drill.metrics.fillerCount > 0 ? "text-warning" : ""}>
              {drill.metrics.fillerCount} Fillers
            </span>
          </div>
          {isOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
        </div>
      </button>
      
      {isOpen && (
        <div className="p-4 border-t border-border">
          {drill.type === DRILL_TYPES.LEVEL_EXPLAIN ? (
            <div className="flex flex-col gap-4 mb-4">
              <div className="bg-black/20 p-4 rounded-lg">
                <h4 className="text-xs font-bold text-text-muted uppercase mb-2">Phase 1: High-Schooler</h4>
                <div className="text-sm text-text-secondary leading-relaxed">
                  {drill.transcript1 || <span className="italic opacity-50">No transcript recorded.</span>}
                </div>
              </div>
              <div className="bg-black/20 p-4 rounded-lg">
                <h4 className="text-xs font-bold text-text-muted uppercase mb-2">Phase 2: Expert</h4>
                <div className="text-sm text-text-secondary leading-relaxed">
                  {drill.transcript2 || <span className="italic opacity-50">No transcript recorded.</span>}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-sm text-text-secondary leading-relaxed bg-black/20 p-4 rounded-lg mb-4">
              {drill.transcript || <span className="italic opacity-50">No transcript recorded.</span>}
            </div>
          )}
          
          {(drill.transcript || (drill.transcript1 && drill.transcript2)) && (
            <div className="bg-accent-primary/10 p-4 rounded-lg border border-accent-primary/20">
              <h4 className="text-xs font-bold text-accent-primary uppercase tracking-wider mb-2">AI Coach Feedback</h4>
              {isLoadingFeedback ? (
                <div className="text-sm text-text-secondary animate-pulse">Analyzing your speech...</div>
              ) : (
                <p className="text-sm text-text-primary whitespace-pre-wrap">{feedback}</p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const SelfRatingSlider = ({ label, value, onChange }) => (
  <div className="mb-6">
    <div className="flex justify-between items-end mb-2">
      <span className="font-medium">{label}</span>
      <span className="text-2xl font-bold text-accent-primary">{value}</span>
    </div>
    <input 
      type="range" 
      min="0" 
      max="10" 
      value={value} 
      onChange={(e) => onChange(parseInt(e.target.value))}
      className="w-full h-2 bg-border rounded-lg appearance-none cursor-pointer accent-accent-primary"
    />
    <div className="flex justify-between text-xs text-text-muted mt-1">
      <span>Poor</span>
      <span>Excellent</span>
    </div>
  </div>
);

const SessionSummary = ({ sessionData, onSave }) => {
  const [ratings, setRatings] = useState({ clarity: 5, confidence: 5, vocabulary: 5 });

  const handleSave = () => {
    onSave({
      ...sessionData,
      selfRating: ratings
    });
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-3xl mx-auto w-full pb-20"
    >
      <div className="text-center mb-10">
        <h1 className="text-4xl font-extrabold mb-4">Session Complete! 🎉</h1>
        <p className="text-xl text-text-secondary">Great job. Review your performance and rate your session.</p>
      </div>

      <div className="glass-card mb-8">
        <h2 className="text-2xl font-bold mb-6">Transcripts & Metrics</h2>
        {sessionData.drills.map((drill, idx) => (
          <DrillAccordion key={drill.id} drill={drill} index={idx} />
        ))}
      </div>

      <div className="glass-card mb-8">
        <h2 className="text-2xl font-bold mb-6">Self-Assessment</h2>
        <p className="text-sm text-text-secondary mb-6">
          How did you feel about your performance overall? This subjective data helps track your confidence over time.
        </p>
        
        <SelfRatingSlider 
          label="Clarity (Were your thoughts structured?)" 
          value={ratings.clarity} 
          onChange={(v) => setRatings({...ratings, clarity: v})} 
        />
        <SelfRatingSlider 
          label="Confidence (Did you speak with authority?)" 
          value={ratings.confidence} 
          onChange={(v) => setRatings({...ratings, confidence: v})} 
        />
        <SelfRatingSlider 
          label="Vocabulary (Did you use precise words?)" 
          value={ratings.vocabulary} 
          onChange={(v) => setRatings({...ratings, vocabulary: v})} 
        />
      </div>

      <button 
        onClick={handleSave}
        className="btn btn-primary w-full py-4 text-xl rounded-xl shadow-lg"
      >
        <Save size={24} />
        Save Session & Return Home
      </button>
    </motion.div>
  );
};

export default SessionSummary;
