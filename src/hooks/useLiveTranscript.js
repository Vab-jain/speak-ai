import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * Hook for managing Web Speech API transcription.
 */
export function useLiveTranscript() {
  const [transcript, setTranscript] = useState('');
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef(null);

  useEffect(() => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      console.warn('Web Speech API is not supported in this browser.');
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognitionRef.current = new SpeechRecognition();
    recognitionRef.current.continuous = true;
    recognitionRef.current.interimResults = true; // Show words as they are spoken

    recognitionRef.current.onresult = (event) => {
      let currentTranscript = '';
      for (let i = 0; i < event.results.length; i++) {
        currentTranscript += event.results[i][0].transcript;
      }
      setTranscript(currentTranscript);
    };

    recognitionRef.current.onerror = (event) => {
      console.error('Speech recognition error', event.error);
      setIsListening(false);
    };

    recognitionRef.current.onend = () => {
      // If we are supposed to be listening but it ended (e.g. timeout), restart it.
      // But we handle explicit stops gracefully.
      if (isListening) {
          try {
             recognitionRef.current.start();
          } catch(e) {
             console.error("Failed to restart recognition", e);
             setIsListening(false);
          }
      }
    };

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  // Update onend if isListening changes so it can auto-restart if needed
  useEffect(() => {
      if (recognitionRef.current) {
          recognitionRef.current.onend = () => {
             if (isListening) {
                 try {
                     recognitionRef.current.start();
                 } catch (e) {
                     console.error("Failed to restart recognition", e);
                     setIsListening(false);
                 }
             }
          };
      }
  }, [isListening])


  const start = useCallback(() => {
    setTranscript('');
    setIsListening(true);
    if (recognitionRef.current) {
      try {
        recognitionRef.current.start();
      } catch (err) {
        console.error('Recognition already started', err);
      }
    }
  }, []);

  const stop = useCallback(() => {
    setIsListening(false);
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
  }, []);

  const reset = useCallback(() => {
    setTranscript('');
  }, []);

  return { transcript, isListening, start, stop, reset };
}
