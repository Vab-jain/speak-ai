
import { motion } from 'framer-motion';
import { Play, RotateCcw, Trash2, Clock } from 'lucide-react';

const SessionPreview = ({ drills, onStart, onSwap, onRemove }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-3xl mx-auto w-full pb-20 pt-10"
    >
      <div className="text-center mb-10">
        <h1 className="text-4xl font-extrabold mb-4">Your Session is Ready</h1>
        <p className="text-xl text-text-secondary">
          We've curated {drills.length} drills for you. Review and customize before starting.
        </p>
      </div>

      <div className="flex flex-col gap-4 mb-12">
        {drills.map((drill, idx) => (
          <div 
            key={drill.id}
            className="glass-card flex items-center justify-between p-6 hover:border-accent-primary/50 group"
          >
            <div className="flex items-center gap-6">
              <div className="w-12 h-12 bg-white/5 rounded-xl flex items-center justify-center text-accent-primary font-bold text-xl">
                {idx + 1}
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-semibold uppercase tracking-wider text-accent-primary px-2 py-0.5 bg-accent-primary/10 rounded">
                    {drill.label}
                  </span>
                  <div className="flex items-center gap-1 text-xs text-text-muted">
                    <Clock size={12} />
                    <span>{drill.durationSeconds}s</span>
                  </div>
                </div>
                <h3 className="text-lg font-bold group-hover:text-white transition-colors line-clamp-1">
                  {drill.prompt || 'Selecting topic...'}
                </h3>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button 
                onClick={() => onSwap(drill.id)}
                className="p-3 text-text-muted hover:text-accent-secondary hover:bg-white/5 rounded-xl transition-all"
                title="Swap Drill"
              >
                <RotateCcw size={20} />
              </button>
              <button 
                onClick={() => onRemove(drill.id)}
                className="p-3 text-text-muted hover:text-danger hover:bg-white/5 rounded-xl transition-all"
                title="Remove Drill"
              >
                <Trash2 size={20} />
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-col items-center gap-6">
        <button 
          onClick={onStart}
          disabled={drills.length === 0}
          className="btn btn-primary px-16 py-5 text-2xl rounded-2xl shadow-[0_0_40px_rgba(139,92,246,0.4)] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Play size={28} fill="white" />
          START FULL SESSION
        </button>
        <p className="text-text-muted text-sm font-medium">
          Estimated total time: {Math.ceil(drills.reduce((acc, d) => acc + d.durationSeconds, 0) / 60)} minutes
        </p>
      </div>
    </motion.div>
  );
};

export default SessionPreview;
