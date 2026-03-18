import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * 범용 카운트다운 타이머 훅
 * @param initialSeconds 초기 시간 (초)
 */
export const useTimer = (initialSeconds: number = 300) => {
  const [timeLeft, setTimeLeft] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const stop = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setIsActive(false);
  }, []);

  const start = useCallback(
    (seconds?: number) => {
      stop();
      setTimeLeft(seconds ?? initialSeconds);
      setIsActive(true);
    },
    [initialSeconds, stop],
  );

  const reset = useCallback(() => {
    stop();
    setTimeLeft(0);
  }, [stop]);

  useEffect(() => {
    if (isActive && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            stop();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isActive, timeLeft, stop]);

  /**
   * 초를 mm:ss 형식으로 변환
   */
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return {
    timeLeft,
    formattedTime: formatTime(timeLeft),
    isActive,
    isExpired: timeLeft === 0 && isActive === false,
    start,
    stop,
    reset,
  };
};
