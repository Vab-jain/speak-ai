import React, { useEffect, useRef } from 'react';
import { Mic } from 'lucide-react';

const LiveTranscriptBox = ({ transcript, isListening }) => {
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [transcript]);

  return (
    <div className="w-full max-w-2xl mx-auto flex flex-col gap-2">
      <div className="flex items-center justify-between px-2">
        <span className="text-sm font-medium text-text-secondary uppercase tracking-wider">
          Live Transcript
        </span>
        {isListening && (
          <div className="flex items-center gap-2 text-accent-secondary">
            <Mic size={14} className="animate-pulse" />
            <span className="text-xs font-semibold animate-pulse">Recording...</span>
          </div>
        )}
      </div>
      <div 
        ref={scrollRef}
        className={`w-full h-48 p-6 glass-card overflow-y-auto text-lg leading-relaxed transition-all duration-300 ${
          isListening ? 'border-accent-secondary/50 shadow-[0_0_15px_rgba(217,70,239,0.15)]' : ''
        }`}
      >
        {transcript ? (
          <span className="text-text-primary">{transcript}</span>
        ) : (
          <span className="text-text-muted italic">Start speaking...</span>
        )}
      </div>
    </div>
  );
};

export default LiveTranscriptBox;
