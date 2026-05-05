import { useState, useRef, useCallback } from 'react';

/**
 * Hook for capturing audio via MediaRecorder API.
 */
export function useAudioRecorder() {
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);

  const start = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      chunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
    } catch (err) {
      console.error('Error accessing microphone', err);
      setIsRecording(false);
    }
  }, []);

  const stop = useCallback(() => {
    return new Promise((resolve) => {
      if (!mediaRecorderRef.current) {
        resolve(null);
        return;
      }

      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' });
        // Stop all tracks to release microphone
        mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
        setIsRecording(false);
        resolve(audioBlob);
      };

      mediaRecorderRef.current.stop();
    });
  }, []);

  return { isRecording, start, stop };
}
