import { useState, useEffect, useCallback } from "react";
import * as Haptics from "expo-haptics";

export interface ActiveTimer {
  stepIndex: number;
  label: string;
  duration: number;
  timeLeft: number;
  isRunning: boolean;
}

export const useTimerManager = () => {
  const [timers, setTimers] = useState<ActiveTimer[]>([]);

  const playTimerDoneSound = async () => {
    try {
      // Placeholder for sound logic
    } catch {
      // Silent fail for sound errors
    }
  };

  // Timer Logic - Only run interval when there are active timers
  useEffect(() => {
    const hasActiveTimers = timers.some((t) => t.isRunning);
    if (!hasActiveTimers) return;

    const interval = setInterval(() => {
      setTimers((prevTimers) =>
        prevTimers.map((t) => {
          if (!t.isRunning) return t;
          if (t.timeLeft <= 0) return t;

          const newTime = t.timeLeft - 1;
          if (newTime === 0) {
            playTimerDoneSound();
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          }
          return { ...t, timeLeft: newTime };
        })
      );
    }, 1000);
    return () => clearInterval(interval);
  }, [timers]);

  const startTimer = useCallback(
    (stepIndex: number, durationMinutes: number | undefined, title: string) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      const durationSeconds = durationMinutes ? durationMinutes * 60 : 0;
      if (!durationSeconds) return;

      setTimers((prev) => {
        const exists = prev.find((t) => t.stepIndex === stepIndex);
        if (exists) {
          return prev.map((t) =>
            t.stepIndex === stepIndex ? { ...t, isRunning: !t.isRunning } : t
          );
        } else {
          return [
            ...prev,
            {
              stepIndex,
              label: title,
              duration: durationSeconds,
              timeLeft: durationSeconds,
              isRunning: true,
            },
          ];
        }
      });
    },
    []
  );

  const stopTimer = useCallback((stepIndex: number) => {
    setTimers((prev) => prev.filter((t) => t.stepIndex !== stepIndex));
  }, []);

  const resetTimer = useCallback((stepIndex: number) => {
    setTimers((prev) =>
      prev.map((t) =>
        t.stepIndex === stepIndex ? { ...t, timeLeft: t.duration, isRunning: false } : t
      )
    );
  }, []);

  const toggleTimer = useCallback((stepIndex: number) => {
    setTimers((prev) =>
      prev.map((t) => (t.stepIndex === stepIndex ? { ...t, isRunning: !t.isRunning } : t))
    );
  }, []);

  const formatTime = useCallback((seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  }, []);

  return {
    timers,
    startTimer,
    stopTimer,
    resetTimer,
    toggleTimer,
    formatTime,
  };
};
