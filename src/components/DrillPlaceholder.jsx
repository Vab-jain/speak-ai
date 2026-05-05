
import { motion } from 'framer-motion';
import { Construction, RotateCcw } from 'lucide-react';

const DrillPlaceholder = ({ drillType, onSwap }) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="glass-card max-w-xl w-full mx-auto flex flex-col items-center text-center p-12"
    >
      <div className="w-20 h-20 bg-warning/20 text-warning rounded-full flex items-center justify-center mb-8 animate-bounce">
        <Construction size={40} />
      </div>
      
      <h2 className="text-3xl font-extrabold mb-4">Under Construction</h2>
      <p className="text-lg text-text-secondary mb-10 leading-relaxed">
        The <span className="text-white font-bold">{drillType}</span> drill is coming soon in a future issue!
        For now, you can swap it for an implemented drill.
      </p>

      <div className="flex flex-col gap-4 w-full">
        <button 
          onClick={onSwap}
          className="btn btn-primary w-full py-4 text-lg"
        >
          <RotateCcw size={20} />
          Swap for Implemented Drill
        </button>
      </div>
    </motion.div>
  );
};

export default DrillPlaceholder;
