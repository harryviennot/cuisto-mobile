/**
 * Onboarding progress indicator
 * Adapts ExtractionProgress.tsx progress bar visual style
 * Shows step number and animated progress bar
 */
import React, { useEffect } from "react";
import { View, Text } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from "react-native-reanimated";
import { useTranslation } from "react-i18next";

interface OnboardingProgressProps {
  currentStep: number;
  totalSteps: number;
}

export function OnboardingProgress({ currentStep, totalSteps }: OnboardingProgressProps) {
  const { t } = useTranslation();

  // Animated progress value for smooth transitions
  const animatedProgress = useSharedValue(0);

  // Calculate progress percentage (0-100)
  const progress = ((currentStep + 1) / totalSteps) * 100;

  useEffect(() => {
    animatedProgress.value = withTiming(progress, {
      duration: 400,
      easing: Easing.out(Easing.cubic),
    });
  }, [progress, animatedProgress]);

  const progressBarStyle = useAnimatedStyle(() => ({
    width: `${Math.min(animatedProgress.value, 100)}%`,
  }));

  return (
    <View className="w-full px-6 pt-4 pb-2">
      {/* Step indicator */}
      <View className="mb-3 flex-row items-center justify-between">
        <Text className="text-sm font-medium text-white/80">
          {t("onboarding.step", { current: currentStep + 1, total: totalSteps })}
        </Text>
        <View className="rounded-full bg-white/20 px-3 py-1">
          <Text className="text-sm font-bold text-white">{Math.round(progress)}%</Text>
        </View>
      </View>

      {/* Progress bar */}
      <View className="h-2 overflow-hidden rounded-full bg-white/20">
        <Animated.View style={progressBarStyle} className="h-full rounded-full bg-white" />
      </View>
    </View>
  );
}
