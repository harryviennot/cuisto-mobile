/**
 * Extraction Widget
 *
 * A floating widget that displays minimized extraction jobs.
 *
 * Features:
 * - Single job (free tier): Shows just the widget item directly (no header)
 * - Multiple jobs (premium): Expandable container with summary header
 * - Dynamic positioning: Above tab bar (if visible) or at bottom (+12px)
 */
import React, { useState } from "react";
import { View, Text, Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, {
  FadeInDown,
  FadeOutDown,
  LinearTransition,
} from "react-native-reanimated";
import { useSegments } from "expo-router";
import {
  CaretUpIcon,
  CaretDownIcon,
  SpinnerIcon,
  CheckCircleIcon,
} from "phosphor-react-native";
import type { ExtractionJob } from "@/contexts/ExtractionContext";
import { ExtractionStatus } from "@/types/extraction";
import { ExtractionWidgetItem } from "./ExtractionWidgetItem";

interface ExtractionWidgetProps {
  jobs: ExtractionJob[];
  onExpand: (jobId: string) => void;
}

export function ExtractionWidget({ jobs, onExpand }: ExtractionWidgetProps) {
  const insets = useSafeAreaInsets();
  const segments = useSegments();
  const [isExpanded, setIsExpanded] = useState(false);

  // Check if we are on a tab page
  const isTabBarVisible = segments.some((segment) => segment === "(tabs)");

  // Calculate stats
  const completedCount = jobs.filter((j) => j.status === ExtractionStatus.COMPLETED).length;
  const activeCount = jobs.filter(
    (j) => j.status === ExtractionStatus.PENDING || j.status === ExtractionStatus.PROCESSING
  ).length;

  // Newest job determines the "face" of the collapsed widget if single
  const sortedJobs = [...jobs].sort((a, b) => b.createdAt - a.createdAt);

  // Calculate bottom offset to position above tab bar
  const bottomOffset = isTabBarVisible
    ? 45 + insets.bottom + 12 // Above tab bar
    : insets.bottom + 12; // Bottom of screen + padding

  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  // Single job mode (free tier) - show just the widget item directly
  const isSingleJob = jobs.length === 1;

  return (
    <Animated.View
      entering={FadeInDown.damping(20).stiffness(150)}
      exiting={FadeOutDown.duration(150)}
      layout={LinearTransition.damping(15).stiffness(20)}
      style={{
        position: "absolute",
        bottom: bottomOffset,
        left: 8,
        right: 8,
        zIndex: 1000,
        borderRadius: 12,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.6,
        shadowRadius: 30,
        elevation: 10,
        overflow: "hidden",
      }}
      className="bg-primary"
    >
      {isSingleJob ? (
        // Single job: show widget item directly without header
        <ExtractionWidgetItem job={sortedJobs[0]} onPress={() => onExpand(sortedJobs[0].id)} />
      ) : (
        <>
          {/* Multiple jobs: Collapsed Header / Summary */}
          <Pressable onPress={toggleExpand} className="flex-row items-center justify-between p-5">
            <View className="flex-row items-center gap-3">
              {/* Summary Icon Indicator */}
              <View className="flex-row -space-x-2">
                {activeCount > 0 && (
                  <View className="h-8 w-8 items-center justify-center rounded-full bg-white/20">
                    <SpinnerIcon color="white" size={16} weight="bold" />
                  </View>
                )}
                {completedCount > 0 && (
                  <View className="h-8 w-8 items-center justify-center rounded-full bg-emerald-500">
                    <CheckCircleIcon color="white" size={16} weight="fill" />
                  </View>
                )}
              </View>

              <View>
                <Text className="text-base font-bold text-white">
                  {activeCount > 0 ? "Extraction in progress" : "Extraction complete"}
                </Text>
                <Text className="text-xs text-white/70 font-medium">
                  {activeCount} active • {completedCount} ready
                </Text>
              </View>
            </View>

            <View className="h-8 w-8 items-center justify-center rounded-full bg-white/10">
              {isExpanded ? (
                <CaretDownIcon size={16} color="white" weight="bold" />
              ) : (
                <CaretUpIcon size={16} color="white" weight="bold" />
              )}
            </View>
          </Pressable>

          {/* Expanded Content */}
          {isExpanded && (
            <Animated.View
              entering={FadeInDown.duration(300).springify()}
              exiting={FadeOutDown.duration(200)}
              className="bg-black/10"
            >
              <View className="max-h-72">
                {sortedJobs.map((job, index) => (
                  <View key={job.id}>
                    <ExtractionWidgetItem job={job} onPress={() => onExpand(job.id)} />
                    {index < sortedJobs.length - 1 && <View className="h-[1px] bg-border-dark/10" />}
                  </View>
                ))}
              </View>
            </Animated.View>
          )}
        </>
      )}
    </Animated.View>
  );
}
