import { useState, useEffect, useRef, useCallback } from 'react';

interface UseTimerProps {
  initialTime: number; // in seconds
  onTimeUp?: () => void;
  autoStart?: boolean;
}

interface UseTimerReturn {
  timeRemaining: number;
  isActive: boolean;
  isPaused: boolean;
  start: () => void;
  pause: () => void;
  resume: () => void;
  reset: () => void;
  formatTime: (seconds: number) => string;
}

export const useTimer = ({ 
  initialTime, 
  onTimeUp, 
  autoStart = false 
}: UseTimerProps): UseTimerReturn => {
  const [timeRemaining, setTimeRemaining] = useState(initialTime);
  const [isActive, setIsActive] = useState(autoStart);
  const [isPaused, setIsPaused] = useState(false);
  const intervalRef = useRef<number | null>(null);

  // Update timeRemaining when initialTime changes
  useEffect(() => {
    setTimeRemaining(initialTime);
  }, [initialTime]);

  const start = useCallback(() => {
    setIsActive(true);
    setIsPaused(false);
  }, []);

  const pause = useCallback(() => {
    setIsPaused(true);
  }, []);

  const resume = useCallback(() => {
    setIsPaused(false);
  }, []);

  const reset = useCallback(() => {
    setTimeRemaining(initialTime);
    setIsActive(false);
    setIsPaused(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, [initialTime]);

  const formatTime = useCallback((seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;

    if (hours > 0) {
      return `${hours.toString().padStart(2, '0')}:${minutes
        .toString()
        .padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
    }
    
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds
      .toString()
      .padStart(2, '0')}`;
  }, []);

  useEffect(() => {
    if (isActive && !isPaused && timeRemaining > 0) {
      intervalRef.current = setInterval(() => {
        setTimeRemaining((prevTime) => {
          if (prevTime <= 1) {
            setIsActive(false);
            if (onTimeUp) {
              onTimeUp();
            }
            return 0;
          }
          return prevTime - 1;
        });
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isActive, isPaused, onTimeUp]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  return {
    timeRemaining,
    isActive,
    isPaused,
    start,
    pause,
    resume,
    reset,
    formatTime,
  };
};
