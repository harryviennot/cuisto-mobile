import { useState, useCallback, useEffect, useRef } from "react";
import { AppState, AppStateStatus } from "react-native";
import type { Instruction } from "@/types/recipe";

interface Timer {
  id: string;
  instructionIndex: number;
  duration: number; // in seconds
  remaining: number; // in seconds
  isRunning: boolean;
  label: string;
}

/**
 * Hook for managing cooking mode functionality
 * Handles step tracking, timers, and cooking progress
 */
export function useCookingMode(instructions: Instruction[]) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const [timers, setTimers] = useState<Map<string, Timer>>(new Map());
  const [isScreenLocked, setIsScreenLocked] = useState(false);

  // Refs for timer management
  const intervalRefs = useRef<Map<string, number>>(new Map());
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);

  /**
   * Current instruction
   */
  const currentInstruction = instructions[currentStepIndex];

  /**
   * Check if we're on the last step
   */
  const isLastStep = currentStepIndex >= instructions.length - 1;

  /**
   * Check if we're on the first step
   */
  const isFirstStep = currentStepIndex === 0;

  /**
   * Calculate overall progress
   */
  const progress = (completedSteps.size / instructions.length) * 100;

  /**
   * Navigate to next step
   */
  const goToNextStep = useCallback(() => {
    if (!isLastStep) {
      setCurrentStepIndex(prev => prev + 1);
    }
  }, [isLastStep]);

  /**
   * Navigate to previous step
   */
  const goToPreviousStep = useCallback(() => {
    if (!isFirstStep) {
      setCurrentStepIndex(prev => prev - 1);
    }
  }, [isFirstStep]);

  /**
   * Jump to a specific step
   */
  const goToStep = useCallback((index: number) => {
    if (index >= 0 && index < instructions.length) {
      setCurrentStepIndex(index);
    }
  }, [instructions.length]);

  /**
   * Mark current step as completed
   */
  const markStepCompleted = useCallback(() => {
    setCompletedSteps(prev => new Set(prev).add(currentStepIndex));

    // Auto-advance to next step if not the last one
    if (!isLastStep) {
      setTimeout(() => goToNextStep(), 300); // Small delay for UX
    }
  }, [currentStepIndex, isLastStep, goToNextStep]);

  /**
   * Mark a step as incomplete
   */
  const markStepIncomplete = useCallback((index: number) => {
    setCompletedSteps(prev => {
      const next = new Set(prev);
      next.delete(index);
      return next;
    });
  }, []);

  /**
   * Toggle step completion
   */
  const toggleStepCompletion = useCallback((index: number) => {
    if (completedSteps.has(index)) {
      markStepIncomplete(index);
    } else {
      setCompletedSteps(prev => new Set(prev).add(index));
    }
  }, [completedSteps, markStepIncomplete]);

  /**
   * Create a timer for the current step
   */
  const createTimer = useCallback((minutes: number, label?: string) => {
    const timerId = `timer-${Date.now()}`;
    const timer: Timer = {
      id: timerId,
      instructionIndex: currentStepIndex,
      duration: minutes * 60,
      remaining: minutes * 60,
      isRunning: false,
      label: label || `Step ${currentStepIndex + 1} Timer`,
    };

    setTimers(prev => new Map(prev).set(timerId, timer));
    return timerId;
  }, [currentStepIndex]);

  /**
   * Start a timer
   */
  const startTimer = useCallback((timerId: string) => {
    setTimers(prev => {
      const next = new Map(prev);
      const timer = next.get(timerId);
      if (timer) {
        timer.isRunning = true;
        next.set(timerId, { ...timer });
      }
      return next;
    });

    // Start the interval
    const interval = setInterval(() => {
      setTimers(prev => {
        const next = new Map(prev);
        const timer = next.get(timerId);

        if (timer && timer.isRunning && timer.remaining > 0) {
          timer.remaining -= 1;
          next.set(timerId, { ...timer });

          // Timer completed
          if (timer.remaining === 0) {
            timer.isRunning = false;
            next.set(timerId, { ...timer });
            // Could trigger notification here
            clearInterval(interval);
            intervalRefs.current.delete(timerId);
          }
        }

        return next;
      });
    }, 1000);

    intervalRefs.current.set(timerId, interval);
  }, []);

  /**
   * Pause a timer
   */
  const pauseTimer = useCallback((timerId: string) => {
    setTimers(prev => {
      const next = new Map(prev);
      const timer = next.get(timerId);
      if (timer) {
        timer.isRunning = false;
        next.set(timerId, { ...timer });
      }
      return next;
    });

    // Clear the interval
    const interval = intervalRefs.current.get(timerId);
    if (interval) {
      clearInterval(interval);
      intervalRefs.current.delete(timerId);
    }
  }, []);

  /**
   * Reset a timer
   */
  const resetTimer = useCallback((timerId: string) => {
    const timer = timers.get(timerId);
    if (timer) {
      pauseTimer(timerId);
      setTimers(prev => {
        const next = new Map(prev);
        next.set(timerId, { ...timer, remaining: timer.duration, isRunning: false });
        return next;
      });
    }
  }, [timers, pauseTimer]);

  /**
   * Delete a timer
   */
  const deleteTimer = useCallback((timerId: string) => {
    pauseTimer(timerId);
    setTimers(prev => {
      const next = new Map(prev);
      next.delete(timerId);
      return next;
    });
  }, [pauseTimer]);

  /**
   * Create and start a timer for current instruction if it has one
   */
  const startInstructionTimer = useCallback(() => {
    if (currentInstruction?.timer_minutes) {
      const timerId = createTimer(
        currentInstruction.timer_minutes,
        currentInstruction.title
      );
      startTimer(timerId);
      return timerId;
    }
    return null;
  }, [currentInstruction, createTimer, startTimer]);

  /**
   * Toggle screen lock (keep screen on during cooking)
   */
  const toggleScreenLock = useCallback(() => {
    setIsScreenLocked(prev => !prev);
    // In a real app, you'd use expo-keep-awake here
  }, []);

  /**
   * Reset cooking mode
   */
  const resetCooking = useCallback(() => {
    setCurrentStepIndex(0);
    setCompletedSteps(new Set());

    // Clear all timers
    timers.forEach((_, timerId) => {
      pauseTimer(timerId);
    });
    setTimers(new Map());
  }, [timers, pauseTimer]);

  /**
   * Handle app state changes (pause timers when app goes to background)
   */
  useEffect(() => {
    const subscription = AppState.addEventListener("change", (nextAppState) => {
      if (
        appStateRef.current.match(/active/) &&
        nextAppState.match(/inactive|background/)
      ) {
        // App is going to background, pause all timers
        timers.forEach((timer) => {
          if (timer.isRunning) {
            pauseTimer(timer.id);
          }
        });
      }
      appStateRef.current = nextAppState;
    });

    return () => {
      subscription.remove();
    };
  }, [timers, pauseTimer]);

  /**
   * Cleanup timers on unmount
   */
  useEffect(() => {
    return () => {
      intervalRefs.current.forEach(interval => clearInterval(interval));
    };
  }, []);

  return {
    // State
    currentStepIndex,
    currentInstruction,
    completedSteps,
    timers: Array.from(timers.values()),
    isScreenLocked,
    progress,
    isFirstStep,
    isLastStep,

    // Navigation
    goToNextStep,
    goToPreviousStep,
    goToStep,

    // Step management
    markStepCompleted,
    markStepIncomplete,
    toggleStepCompletion,

    // Timer management
    createTimer,
    startTimer,
    pauseTimer,
    resetTimer,
    deleteTimer,
    startInstructionTimer,

    // Other actions
    toggleScreenLock,
    resetCooking,
  };
}