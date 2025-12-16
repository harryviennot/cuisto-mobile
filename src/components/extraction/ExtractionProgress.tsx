/**
 * Extraction progress indicator with shimmering text
 * Features:
 * - Progress bar showing real backend progress
 * - Shimmer effect on title text (OpenAI style)
 * - Rotating text with fun cooking-related sentences
 */
import React, { useEffect } from "react";
import { View, Text } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSequence,
  Easing,
  interpolate,
} from "react-native-reanimated";
import { useTranslation } from "react-i18next";
import { ShimmeringTextRotator } from "../loading";
import { getExtractionStepText } from "@/utils/extraction-steps";

interface ExtractionProgressProps {
  progress: number;
  currentStep?: string;
}

export function ExtractionProgress({ progress, currentStep }: ExtractionProgressProps) {
  const { t } = useTranslation();

  // Animated progress value for smooth transitions
  const animatedProgress = useSharedValue(0);

  // Shimmer animation for title (OpenAI style)
  const shimmerAnimation = useSharedValue(0);

  useEffect(() => {
    // Start shimmer animation
    shimmerAnimation.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
        withTiming(0, { duration: 1000, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      false
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const shimmerStyle = useAnimatedStyle(() => {
    const opacity = interpolate(shimmerAnimation.value, [0, 0.5, 1], [0.6, 1, 0.6]);
    return { opacity };
  });

  // Animate to the real progress value with smooth transition
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
    <View className="flex-1 w-full">
      {/* Progress Bar Section at top */}
      <View className="w-full px-6 pt-6 pb-4">
        {/* Progress percentage with shimmer */}
        <View className="mb-3 flex-row items-center justify-between">
          <Animated.Text
            style={shimmerStyle}
            className="text-base font-semibold text-foreground-heading"
          >
            {t("extraction.extractingRecipe")}
          </Animated.Text>
          <View className="rounded-full bg-primary/10 px-3 py-1">
            <Text className="text-sm font-bold text-primary">{progress}%</Text>
          </View>
        </View>

        {/* Enhanced progress bar */}
        <View className="mb-2 h-3 overflow-hidden rounded-full bg-surface-elevated shadow-sm">
          <Animated.View style={progressBarStyle} className="h-full rounded-full bg-primary" />
        </View>

        {/* Current step - translated from step code */}
        {currentStep && (
          <Text className="text-center text-sm text-foreground-secondary">
            {getExtractionStepText(t, currentStep)}
          </Text>
        )}
      </View>

      {/* Shimmering text rotator centered in remaining space */}
      <View className="flex-1 items-center justify-center">
        <ShimmeringTextRotator interval={3000} textSize="text-lg" />
      </View>
    </View>
  );
}
