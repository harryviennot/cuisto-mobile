import { useMemo } from "react";
import type { Instruction } from "@/types/recipe";
import type { ActiveTimer } from "./useTimerManager";

/**
 * Specialized hook for StepCard component
 * Composes timer data specific to the current step
 * Note: All state is passed as props to avoid duplicate hook instances
 */
export const useStepCardData = (
  currentStep: number,
  step: Instruction | undefined,
  timers: ActiveTimer[]
) => {
  // Derive current step timer
  const currentTimer = useMemo<ActiveTimer | undefined>(
    () => timers.find((t) => t.stepIndex === currentStep),
    [timers, currentStep]
  );

  // Derive step duration
  const stepDurationSeconds = useMemo(
    () => (step?.timer_minutes ? step.timer_minutes * 60 : 0),
    [step]
  );

  return {
    currentTimer,
    stepDurationSeconds,
  };
};
