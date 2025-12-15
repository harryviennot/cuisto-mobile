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
} from "react-native-reanimated";
import { CheckCircleIcon, WarningCircleIcon, SpinnerIcon } from "phosphor-react-native";
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
  const isInProgress =
    job.status === ExtractionStatus.PENDING || job.status === ExtractionStatus.PROCESSING;

  // Animate progress bar
  useEffect(() => {
    animatedProgress.value = withTiming(job.progress_percentage, {
      duration: 400,
      easing: Easing.out(Easing.cubic),
    });
  }, [job.progress_percentage, animatedProgress]);

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

  const progressBarStyle = useAnimatedStyle(() => ({
    width: `${Math.min(animatedProgress.value, 100)}%`,
  }));

  const spinnerStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${spinnerRotation.value}deg` }],
  }));

  const iconContainerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
  }));

  // Get status text
  const getStatusText = () => {
    if (isComplete) {
      return t("extraction.widget.recipeReady", "Recipe ready! Tap to view");
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

  // Get background color based on state
  const getBackgroundColor = () => {
    if (isFailed) {
      return "bg-state-error";
    }
    return "bg-primary";
  };

  return (
    <Pressable
      onPress={onPress}
      className={`${getBackgroundColor()} rounded-2xl px-4 py-3 mb-2 shadow-lg active:opacity-90`}
      style={{
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 4,
      }}
    >
      <View className="flex-row items-center">
        {/* Icon */}
        <Animated.View style={iconContainerStyle} className="mr-3">
          {isComplete && <CheckCircleIcon size={24} color="#FFFFFF" weight="fill" />}
          {isFailed && <WarningCircleIcon size={24} color="#FFFFFF" weight="fill" />}
          {isInProgress && (
            <Animated.View style={spinnerStyle}>
              <SpinnerIcon size={24} color="#FFFFFF" weight="bold" />
            </Animated.View>
          )}
        </Animated.View>

        {/* Content */}
        <View className="flex-1">
          {/* Status text */}
          <Text className="text-white font-semibold text-sm" numberOfLines={1}>
            {getStatusText()}
          </Text>

          {/* Progress bar (only for in-progress jobs) */}
          {isInProgress && (
            <View className="mt-2 h-1.5 bg-white/30 rounded-full overflow-hidden">
              <Animated.View
                style={progressBarStyle}
                className="h-full bg-white rounded-full"
              />
            </View>
          )}

          {/* Progress percentage (only for in-progress jobs) */}
          {isInProgress && (
            <Text className="text-white/80 text-xs mt-1">
              {job.progress_percentage}%
              {job.current_step ? ` - ${job.current_step}` : ""}
            </Text>
          )}
        </View>

        {/* Chevron indicator */}
        <View className="ml-2">
          <Text className="text-white/60 text-lg">&gt;</Text>
        </View>
      </View>
    </Pressable>
  );
}
