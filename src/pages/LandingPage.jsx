import React from 'react';
import { motion } from 'framer-motion';
import { Play, Flame, Clock, Cpu, MessageSquare } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useSettings } from '../context/SettingsContext';

const LandingPage = () => {
  const navigate = useNavigate();
  const { settings, updateSettings } = useSettings();

  return (
    <div className="max-w-4xl mx-auto px-6 pt-20 flex flex-col items-center text-center">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-12"
      >
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-accent-primary/10 text-accent-primary rounded-full mb-6 font-semibold border border-accent-primary/20">
          <Flame size={18} fill="currentColor" />
          <span>0 DAY STREAK</span>
        </div>
        <h1 className="text-5xl md:text-7xl font-extrabold mb-6">
          Level Up Your <span className="gradient-text">Communication</span>
        </h1>
        <p className="text-xl text-text-secondary max-w-2xl mx-auto">
          Master comprehensivity, authority, and maturity in your speaking. 
          15 minutes a day, zero friction.
        </p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full mb-12">
        <button
          onClick={() => navigate('/drill?mode=technical')}
          className="glass-card flex flex-col items-start p-8 text-left hover:border-accent-primary group transition-all"
        >
          <div className="p-3 bg-accent-primary/10 rounded-xl text-accent-primary mb-6 group-hover:scale-110 transition-transform">
            <Cpu size={32} />
          </div>
          <h3 className="text-2xl font-bold mb-2">Technical Mode</h3>
          <p className="text-text-secondary">Focus on domain vocabulary, RAG, System Design, and ML concepts.</p>
        </button>

        <button
          onClick={() => navigate('/drill?mode=general')}
          className="glass-card flex flex-col items-start p-8 text-left hover:border-accent-secondary group transition-all"
        >
          <div className="p-3 bg-accent-secondary/10 rounded-xl text-accent-secondary mb-6 group-hover:scale-110 transition-transform">
            <MessageSquare size={32} />
          </div>
          <h3 className="text-2xl font-bold mb-2">General Mode</h3>
          <p className="text-text-secondary">Improve storytelling, persuasion, and everyday fluency.</p>
        </button>
      </div>

      <div className="flex flex-col items-center gap-4">
        <div className="flex items-center gap-6 mb-4">
          {[10, 15].map((duration) => (
            <button
              key={duration}
              onClick={() => updateSettings({ durationPreference: duration })}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-all ${
                settings.durationPreference === duration
                  ? 'bg-white/10 border-white/20 text-white'
                  : 'border-border text-text-muted hover:border-text-muted'
              }`}
            >
              <Clock size={16} />
              <span className="font-medium">{duration} MIN</span>
            </button>
          ))}
        </div>
        
        <button 
          onClick={() => navigate('/drill')}
          className="btn btn-primary px-12 py-4 text-xl rounded-2xl"
        >
          <Play size={24} fill="white" />
          START TODAY'S SESSION
        </button>
      </div>
    </div>
  );
};

export default LandingPage;
