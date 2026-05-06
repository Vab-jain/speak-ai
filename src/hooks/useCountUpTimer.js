import { useState, useEffect, useRef } from 'react';

/**
 * Hook for managing a drill's count-up timer.
 */
export function useCountUpTimer() {
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState(0); // 0 to 1
  const durationRef = useRef(0);
  const timerRef = useRef(null);

  const start = (targetDurationSeconds) => {
    durationRef.current = targetDurationSeconds;
    setTimeElapsed(0);
    setProgress(0);
    setIsRunning(true);
  };

  const pause = () => setIsRunning(false);
  
  const reset = () => {
    setTimeElapsed(0);
    setProgress(0);
  };

  const stop = () => {
    setIsRunning(false);
    setTimeElapsed(0);
    setProgress(0);
    if (timerRef.current) clearInterval(timerRef.current);
  };

  useEffect(() => {
    if (isRunning) {
      timerRef.current = setInterval(() => {
        setTimeElapsed((prev) => {
          const newTime = prev + 1;
          setProgress(newTime / durationRef.current);
          if (newTime >= durationRef.current) {
            setIsRunning(false);
            clearInterval(timerRef.current);
          }
          return newTime;
        });
      }, 1000);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRunning]);

  return { timeElapsed, isRunning, progress, start, pause, reset, stop };
}
