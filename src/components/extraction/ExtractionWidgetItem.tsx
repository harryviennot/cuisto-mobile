/**
 * Extraction Widget Item
 *
 * A single extraction job displayed in the minimized widget.
 * Shows progress bar, status text, and completion indicator.
 *
 * Visual States:
 * - In progress: Primary color background, progress bar, "Extracting recipe..." text
 * - Completed: Primary color background, checkmark icon, "Recipe ready! Tap to view"
 * - Failed: Error state with tap to see details
 */
import React, { useEffect } from "react";
import { View, Text, Pressable } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSequence,
  Easing,
  interpolate,
} from "react-native-reanimated";
import { CheckCircleIcon, WarningCircleIcon, SpinnerIcon, CaretRightIcon } from "phosphor-react-native";
import { useTranslation } from "react-i18next";
import type { ExtractionJob } from "@/contexts/ExtractionContext";
import { ExtractionStatus } from "@/types/extraction";

interface ExtractionWidgetItemProps {
  job: ExtractionJob;
  onPress: () => void;
}

export function ExtractionWidgetItem({ job, onPress }: ExtractionWidgetItemProps) {
  const { t } = useTranslation();

  // Animated progress value
  const animatedProgress = useSharedValue(0);

  // Spinner rotation for in-progress state
  const spinnerRotation = useSharedValue(0);

  // Pulse animation for completion
  const pulseScale = useSharedValue(1);

  // Determine job state
  const isComplete = job.status === ExtractionStatus.COMPLETED;
  const isFailed =
    job.status === ExtractionStatus.FAILED ||
    job.status === ExtractionStatus.NOT_A_RECIPE ||
    job.status === ExtractionStatus.WEBSITE_BLOCKED;
  const isInProgress = job.status === ExtractionStatus.PENDING || job.status === ExtractionStatus.PROCESSING;

  // Animate to the real progress value with smooth transition
  useEffect(() => {
    animatedProgress.value = withTiming(job.progress_percentage, {
      duration: 400,
      easing: Easing.out(Easing.cubic),
    });
  }, [job.progress_percentage, animatedProgress]);

  const progressBarStyle = useAnimatedStyle(() => ({
    width: `${Math.min(animatedProgress.value, 100)}%`,
  }));

  // Animate spinner for in-progress state
  useEffect(() => {
    if (isInProgress) {
      spinnerRotation.value = withRepeat(
        withTiming(360, { duration: 1000, easing: Easing.linear }),
        -1,
        false
      );
    }
  }, [isInProgress, spinnerRotation]);

  // Pulse animation on completion
  useEffect(() => {
    if (isComplete) {
      pulseScale.value = withSequence(
        withTiming(1.1, { duration: 150 }),
        withTiming(1, { duration: 150 })
      );
    }
  }, [isComplete, pulseScale]);

  const spinnerStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${spinnerRotation.value}deg` }],
  }));

  const iconContainerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
  }));

  // Shimmer animation for title
  const shimmerAnimation = useSharedValue(0);

  useEffect(() => {
    if (isInProgress) {
      shimmerAnimation.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
          withTiming(0, { duration: 1500, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        false
      );
    }
  }, [isInProgress, shimmerAnimation]);

  const shimmerStyle = useAnimatedStyle(() => {
    const opacity = interpolate(shimmerAnimation.value, [0, 0.5, 1], [0.5, 1, 0.5]);
    return { opacity };
  });

  // Get status text
  const getStatusText = () => {
    if (isComplete) {
      return t("extraction.widget.recipeReady", "Recipe ready!");
    }
    if (isFailed) {
      if (job.status === ExtractionStatus.NOT_A_RECIPE) {
        return t("extraction.widget.notARecipe", "Not a recipe");
      }
      if (job.status === ExtractionStatus.WEBSITE_BLOCKED) {
        return t("extraction.widget.websiteBlocked", "Website blocked");
      }
      return t("extraction.widget.failed", "Extraction failed");
    }
    return t("extraction.widget.extracting", "Extracting recipe...");
  };

  return (
    <Pressable
      onPress={onPress}
      className="flex-row items-center py-4 px-5 min-h-16"
    >
      <View className="flex-row items-center flex-1">
        {/* Icon */}
        <Animated.View style={iconContainerStyle} className="mr-4">
          {isComplete && <CheckCircleIcon size={28} color="white" weight="fill" />}
          {isFailed && <WarningCircleIcon size={28} color="white" weight="fill" />}
          {isInProgress && (
            <Animated.View style={spinnerStyle}>
              <SpinnerIcon size={28} color="white" weight="bold" />
            </Animated.View>
          )}
        </Animated.View>

        {/* Content */}
        <View className="flex-1 justify-center">
          {/* Row 1: Current step (left) & Percentage (right) */}
          <View className="flex-row items-center justify-between">
            <Animated.Text
              style={isInProgress ? shimmerStyle : { opacity: 1, color: "white" }}
              className="text-white font-bold text-sm flex-1 mr-4"
              numberOfLines={1}
            >
              {job.current_step || getStatusText()}
            </Animated.Text>

            {isInProgress && (
              <Text className="text-white font-bold text-xs tabular-nums">
                {Math.round(job.progress_percentage)}%
              </Text>
            )}
          </View>

          {/* Row 2: Progress bar (only for in-progress jobs) */}
          {isInProgress ? (
            <View className="h-2 w-full overflow-hidden rounded-full bg-white/20 mt-2 mb-1">
              <Animated.View style={progressBarStyle} className="h-full rounded-full bg-white" />
            </View>
          ) : (
            /* Subtext for completed/failed state */
            <Text className="text-white/70 text-sm" numberOfLines={1}>
              {isComplete
                ? t("extraction.widget.tapToView", "Tap to view recipe")
                : (job.error_message || t("extraction.widget.tapRetry", "Tap to try again"))}
            </Text>
          )}
        </View>

        {/* Chevron indicator */}
        <View className="ml-4">
          <CaretRightIcon size={20} color="white" weight="bold" />
        </View>
      </View>
    </Pressable>
  );
}
