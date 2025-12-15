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
import React, { useState, useCallback } from "react";
import { View, Text, Pressable, LayoutChangeEvent } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, {
  FadeInDown,
  FadeOutDown,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  Easing,
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

  // Track the measured content height
  const [contentHeight, setContentHeight] = useState(0);

  // Animated height for expand/collapse
  const expandedHeight = useSharedValue(0);

  // Check if we are on a tab page
  const isTabBarVisible = segments.some((segment) => segment === "(tabs)");

  // Calculate stats
  const completedCount = jobs.filter((j) => j.status === ExtractionStatus.COMPLETED).length;
  const activeCount = jobs.filter(
    (j) => j.status === ExtractionStatus.PENDING || j.status === ExtractionStatus.PROCESSING
  ).length;
  const erroredCount = jobs.filter((j) => j.status === ExtractionStatus.FAILED || j.status === ExtractionStatus.NOT_A_RECIPE || j.status === ExtractionStatus.WEBSITE_BLOCKED).length;

  // Newest job determines the "face" of the collapsed widget if single
  const sortedJobs = [...jobs].sort((a, b) => b.createdAt - a.createdAt);

  // Calculate bottom offset to position above tab bar
  const bottomOffset = isTabBarVisible
    ? 45 + insets.bottom + 12 // Above tab bar
    : insets.bottom + 12; // Bottom of screen + padding

  // Measure the actual content height
  const onContentLayout = useCallback((event: LayoutChangeEvent) => {
    const { height } = event.nativeEvent.layout;
    if (height > 0 && height !== contentHeight) {
      setContentHeight(height);
    }
  }, [contentHeight]);

  const toggleExpand = useCallback(() => {
    const newExpanded = !isExpanded;
    setIsExpanded(newExpanded);
    expandedHeight.value = withTiming(newExpanded ? contentHeight : 0, {
      duration: 250,
      easing: Easing.bezier(0.25, 0.1, 0.25, 1),
    });
  }, [isExpanded, expandedHeight, contentHeight]);

  // Animated style for the expanded content container
  const expandedContentStyle = useAnimatedStyle(() => ({
    height: expandedHeight.value,
    overflow: "hidden",
  }));

  // Single job mode (free tier) - show just the widget item directly
  const isSingleJob = jobs.length === 1;

  return (
    <Animated.View
      entering={FadeInDown.damping(20).stiffness(150)}
      exiting={FadeOutDown.duration(150)}
      style={{
        position: "absolute",
        bottom: bottomOffset,
        left: 8,
        right: 8,
        zIndex: 1000,
        // Shadow container - no overflow hidden here so shadow renders
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.45,
        shadowRadius: 16,
        elevation: 24, // Higher elevation for more prominent Android shadow
      }}
    >
      {/* Inner container with overflow hidden for rounded corners */}
      <View
        style={{
          borderRadius: 12,
          overflow: "hidden",
          // Secondary subtle shadow for depth
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.45,
          shadowRadius: 16,
          elevation: 24, // Higher elevation for more prominent Android shadow
        }}
        className="bg-primary"
      >
        {isSingleJob ? (
          // Single job: show widget item directly without header
          <ExtractionWidgetItem job={sortedJobs[0]} onPress={() => onExpand(sortedJobs[0].id)} />
        ) : (
          <>
            {/* Hidden measurement container - renders off-screen to measure actual height */}
            <View
              style={{ position: "absolute", opacity: 0, pointerEvents: "none" }}
              onLayout={onContentLayout}
            >
              {sortedJobs.map((job, index) => (
                <View key={job.id}>
                  <ExtractionWidgetItem job={job} onPress={() => { }} />
                  {index < sortedJobs.length - 1 && <View className="h-[1px] bg-border-dark/10" />}
                </View>
              ))}
            </View>

            {/* Expanded Content - positioned ABOVE the header using animated height */}
            <Animated.View style={expandedContentStyle} className="bg-black/10">
              {sortedJobs.map((job, index) => (
                <View key={job.id}>
                  <ExtractionWidgetItem job={job} onPress={() => onExpand(job.id)} />
                  {index < sortedJobs.length - 1 && <View className="h-[1px] bg-border-dark/10" />}
                </View>
              ))}
            </Animated.View>

            {/* Multiple jobs: Header / Summary - always at bottom */}
            <Pressable onPress={toggleExpand} className="flex-row items-center justify-between p-5">
              <View className="flex-row items-center gap-3">
                {/* Summary Icon - single icon showing primary state */}
                {activeCount > 0 ? (
                  <View className="h-10 w-10 items-center justify-center rounded-full bg-white/20">
                    <SpinnerIcon color="white" size={20} weight="bold" />
                  </View>
                ) : (
                  <View className="h-10 w-10 items-center justify-center rounded-full bg-emerald-500">
                    <CheckCircleIcon color="white" size={20} weight="fill" />
                  </View>
                )}

                <View>
                  <Text className="text-base font-bold text-white">
                    {activeCount > 0 ? "Extraction in progress" : "Extraction complete"}
                  </Text>
                  <Text className="text-xs text-white/70 font-medium">
                    {activeCount} active • {completedCount} ready • {completedCount} failed
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
          </>
        )}
      </View>
    </Animated.View>
  );
}
