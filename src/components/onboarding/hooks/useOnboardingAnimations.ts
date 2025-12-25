import { useState, useCallback } from "react";
import { useSharedValue, withTiming, runOnJS, Easing, SharedValue } from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { STEPS } from "../constants";

interface UseOnboardingAnimationsProps {
  currentStep: number;
  setCurrentStep: (step: number) => void;
}

interface UseOnboardingAnimationsReturn {
  animatedStep: SharedValue<number>;
  goToNextStep: () => void;
  goToPreviousStep: () => void;
  isAnimating: boolean;
}

export function useOnboardingAnimations({
  currentStep,
  setCurrentStep,
}: UseOnboardingAnimationsProps): UseOnboardingAnimationsReturn {
  const [isAnimating, setIsAnimating] = useState(false);

  // Animated value that smoothly transitions between steps
  const animatedStep = useSharedValue(0);

  const goToNextStep = useCallback(() => {
    if (isAnimating || currentStep >= STEPS.length - 1) return;

    setIsAnimating(true);

    const nextStep = currentStep + 1;
    setCurrentStep(nextStep);

    // Animate to the next step
    animatedStep.value = withTiming(
      nextStep,
      { duration: 300, easing: Easing.out(Easing.cubic) },
      () => {
        runOnJS(setIsAnimating)(false);
      }
    );
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Soft);
  }, [currentStep, isAnimating, animatedStep, setCurrentStep]);

  const goToPreviousStep = useCallback(() => {
    if (isAnimating || currentStep <= 0) return;

    setIsAnimating(true);

    const prevStep = currentStep - 1;
    setCurrentStep(prevStep);

    // Animate to the previous step
    animatedStep.value = withTiming(
      prevStep,
      { duration: 300, easing: Easing.out(Easing.cubic) },
      () => {
        runOnJS(setIsAnimating)(false);
      }
    );
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Soft);
  }, [currentStep, isAnimating, animatedStep, setCurrentStep]);

  return {
    animatedStep,
    goToNextStep,
    goToPreviousStep,
    isAnimating,
  };
}
