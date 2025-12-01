import { useState, useCallback } from "react";
import { useWindowDimensions, ViewStyle } from "react-native";
import {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  interpolate,
  useDerivedValue,
  runOnJS,
  Easing,
  AnimatedStyle,
} from "react-native-reanimated";

import { STEPS } from "../constants";

interface UseOnboardingAnimationsProps {
  currentStep: number;
  setCurrentStep: (step: number) => void;
}

interface UseOnboardingAnimationsReturn {
  contentAnimatedStyle: AnimatedStyle<ViewStyle>;
  goToNextStep: () => void;
  goToPreviousStep: () => void;
  isAnimating: boolean;
}

export function useOnboardingAnimations({
  currentStep,
  setCurrentStep,
}: UseOnboardingAnimationsProps): UseOnboardingAnimationsReturn {
  const { width } = useWindowDimensions();
  const [isAnimating, setIsAnimating] = useState(false);

  const slideAnim = useSharedValue(0);

  const contentTranslateX = useDerivedValue(() => {
    return interpolate(slideAnim.value, [-1, 0, 1], [-width, 0, width]);
  });

  const contentScale = useDerivedValue(() => {
    return interpolate(slideAnim.value, [-1, 0, 1], [0.9, 1, 0.9]);
  });

  const contentOpacity = useDerivedValue(() => {
    return interpolate(slideAnim.value, [-1, 0, 1], [0, 1, 0]);
  });

  const contentAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: contentTranslateX.value }, { scale: contentScale.value }],
    opacity: contentOpacity.value,
  }));

  const goToNextStep = useCallback(() => {
    if (isAnimating || currentStep >= STEPS.length - 1) return;

    setIsAnimating(true);

    // Slide out to the left
    slideAnim.value = withTiming(-1, { duration: 250, easing: Easing.out(Easing.cubic) }, () => {
      runOnJS(setCurrentStep)(currentStep + 1);
      // Reset to right side
      slideAnim.value = 1;
      // Slide in from right
      slideAnim.value = withTiming(0, { duration: 300, easing: Easing.out(Easing.cubic) }, () => {
        runOnJS(setIsAnimating)(false);
      });
    });
  }, [currentStep, isAnimating, slideAnim, setCurrentStep]);

  const goToPreviousStep = useCallback(() => {
    if (isAnimating || currentStep <= 0) return;

    setIsAnimating(true);

    // Slide out to the right
    slideAnim.value = withTiming(1, { duration: 250, easing: Easing.out(Easing.cubic) }, () => {
      runOnJS(setCurrentStep)(currentStep - 1);
      // Reset to left side
      slideAnim.value = -1;
      // Slide in from left
      slideAnim.value = withTiming(0, { duration: 300, easing: Easing.out(Easing.cubic) }, () => {
        runOnJS(setIsAnimating)(false);
      });
    });
  }, [currentStep, isAnimating, slideAnim, setCurrentStep]);

  return {
    contentAnimatedStyle,
    goToNextStep,
    goToPreviousStep,
    isAnimating,
  };
}
