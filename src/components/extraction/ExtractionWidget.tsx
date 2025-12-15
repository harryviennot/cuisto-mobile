/**
 * Extraction Widget
 *
 * A floating widget that displays minimized extraction jobs above the tab bar.
 * Allows users to see extraction progress while navigating the app.
 *
 * Features:
 * - Positioned above the tab bar
 * - Animated entrance/exit
 * - Shows all minimized extraction jobs stacked
 * - Tap to expand (navigate to full preview)
 */
import React from "react";
import { View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, { FadeInDown, FadeOutDown, Layout } from "react-native-reanimated";
import { useDeviceType } from "@/hooks/useDeviceType";
import type { ExtractionJob } from "@/contexts/ExtractionContext";
import { ExtractionWidgetItem } from "./ExtractionWidgetItem";

interface ExtractionWidgetProps {
  jobs: ExtractionJob[];
  onExpand: (jobId: string) => void;
}

export function ExtractionWidget({ jobs, onExpand }: ExtractionWidgetProps) {
  const insets = useSafeAreaInsets();
  const { isTablet } = useDeviceType();

  // Calculate bottom offset to position above tab bar
  // Phone: 45px tab bar + safe area + padding
  // Tablet: Floating capsule is ~60px + safe area + padding
  const bottomOffset = isTablet
    ? insets.bottom + 80  // Above floating capsule tab bar
    : insets.bottom + 60; // Above standard tab bar (45 + padding)

  // Sort jobs by creation time (newest first)
  const sortedJobs = [...jobs].sort((a, b) => b.createdAt - a.createdAt);

  return (
    <Animated.View
      entering={FadeInDown.springify().damping(15).stiffness(150)}
      exiting={FadeOutDown.duration(200)}
      layout={Layout.springify()}
      style={{
        position: "absolute",
        bottom: bottomOffset,
        left: 16,
        right: 16,
        zIndex: 1000,
      }}
    >
      <View>
        {sortedJobs.map((job, index) => (
          <Animated.View
            key={job.id}
            entering={FadeInDown.delay(index * 50).springify()}
            layout={Layout.springify()}
          >
            <ExtractionWidgetItem
              job={job}
              onPress={() => onExpand(job.id)}
            />
          </Animated.View>
        ))}
      </View>
    </Animated.View>
  );
}
