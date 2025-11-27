import { useState, useMemo, useCallback } from "react";
import type { Recipe } from "@/types/recipe";

export const useStepNavigation = (recipe: Recipe) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isFinished, setIsFinished] = useState(false);

  // Memoize sorted instructions to avoid O(n log n) sorting on every render
  const instructions = useMemo(
    () => [...recipe.instructions].sort((a, b) => a.step_number - b.step_number),
    [recipe.instructions]
  );

  const totalSteps = instructions.length;
  const step = instructions[currentStep];
  const nextStep = instructions[currentStep + 1];

  const goToNextStep = useCallback(() => {
    if (currentStep < totalSteps - 1) {
      setCurrentStep((prev) => prev + 1);
    }
  }, [currentStep, totalSteps]);

  const goToPrevStep = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  }, [currentStep]);

  const finishCooking = useCallback(() => {
    setIsFinished(true);
  }, []);

  return {
    currentStep,
    totalSteps,
    step,
    nextStep,
    instructions,
    isFinished,
    goToNextStep,
    goToPrevStep,
    finishCooking,
  };
};
