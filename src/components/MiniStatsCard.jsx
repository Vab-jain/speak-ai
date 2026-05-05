
import { Play, Check, Activity, AlertTriangle } from 'lucide-react';
import { motion } from 'framer-motion';

const MiniStatsCard = ({ wpm, fillerCount, detectedFillers, isLastDrill, onNext }) => {
  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="glass-card max-w-md w-full mx-auto flex flex-col items-center text-center p-8"
    >
      <div className="w-16 h-16 bg-success/20 text-success rounded-full flex items-center justify-center mb-6">
        <Check size={32} />
      </div>
      
      <h2 className="text-3xl font-bold mb-2">Drill Complete!</h2>
      <p className="text-text-secondary mb-8">Take a breath before moving on.</p>

      <div className="grid grid-cols-2 gap-4 w-full mb-8">
        <div className="bg-white/5 border border-white/10 rounded-xl p-4 flex flex-col items-center">
          <Activity className="text-accent-primary mb-2" size={24} />
          <span className="text-3xl font-bold">{wpm}</span>
          <span className="text-xs text-text-muted uppercase tracking-wider font-semibold mt-1">Words / Min</span>
        </div>
        
        <div className="bg-white/5 border border-white/10 rounded-xl p-4 flex flex-col items-center">
          <AlertTriangle className={fillerCount > 0 ? "text-warning mb-2" : "text-text-muted mb-2"} size={24} />
          <span className="text-3xl font-bold">{fillerCount}</span>
          <span className="text-xs text-text-muted uppercase tracking-wider font-semibold mt-1">Fillers Used</span>
        </div>
      </div>

      {detectedFillers.length > 0 && (
        <div className="w-full mb-8 text-left">
          <span className="text-xs text-text-muted uppercase tracking-wider font-semibold mb-2 block">Detected Fillers</span>
          <div className="flex flex-wrap gap-2">
            {detectedFillers.map((filler, idx) => (
              <span key={idx} className="px-3 py-1 bg-warning/10 text-warning text-sm rounded-full border border-warning/20">
                "{filler}"
              </span>
            ))}
          </div>
        </div>
      )}

      <button 
        onClick={onNext}
        className="btn btn-primary w-full py-4 text-lg"
      >
        {isLastDrill ? (
          <>View Session Summary <Check size={20} /></>
        ) : (
          <>Next Drill <Play size={20} /></>
        )}
      </button>
    </motion.div>
  );
};

export default MiniStatsCard;
