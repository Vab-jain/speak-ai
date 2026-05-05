import { useState, useEffect, useRef } from 'react';

/**
 * Hook for managing a drill's countdown timer.
 */
export function useDrillTimer() {
  const [timeLeft, setTimeLeft] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState(1); // 1 to 0
  const durationRef = useRef(0);
  const timerRef = useRef(null);

  const start = (durationSeconds) => {
    durationRef.current = durationSeconds;
    setTimeLeft(durationSeconds);
    setProgress(1);
    setIsRunning(true);
  };

  const pause = () => setIsRunning(false);
  const reset = () => {
    setIsRunning(false);
    setTimeLeft(0);
    setProgress(0);
    if (timerRef.current) clearInterval(timerRef.current);
  };

  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          const newTime = prev - 1;
          setProgress(newTime / durationRef.current);
          if (newTime <= 0) {
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
  }, [isRunning, timeLeft]);

  return { timeLeft, isRunning, progress, start, pause, reset };
}
