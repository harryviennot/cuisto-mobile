import React, { useMemo } from "react";
import { View, Text, Pressable, ScrollView } from "react-native";
import { X } from "phosphor-react-native";
import Animated, { SlideInUp, FadeOut } from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import type { ActiveTimer } from "./hooks/useTimerManager";

interface TimerDockProps {
  currentStep: number;
  timers: ActiveTimer[];
  stopTimer: (stepIndex: number) => void;
  formatTime: (seconds: number) => string;
  onSelectTimer: (stepIndex: number) => void;
}

/**
 * TimerDock - Horizontal scrollable list of active timers
 * Receives all state as props to ensure single source of truth
 */
export const TimerDock: React.FC<TimerDockProps> = ({
  currentStep,
  timers,
  stopTimer,
  formatTime,
  onSelectTimer,
}) => {
  // Filter to show only "other" timers (not for current step)
  const otherTimers = useMemo(
    () => timers.filter((t) => t.stepIndex !== currentStep).sort((a, b) => a.timeLeft - b.timeLeft),
    [timers, currentStep]
  );

  if (otherTimers.length === 0) return <View className="h-[50px]" />;

  return (
    <View className="z-10 py-2 h-[50px]">
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 24, gap: 8 }}
      >
        {otherTimers.map((t) => (
          <Pressable
            key={t.stepIndex}
            onLongPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
              onSelectTimer(t.stepIndex);
            }}
            delayLongPress={200}
          >
            <Animated.View
              entering={SlideInUp}
              exiting={FadeOut}
              className="flex-row items-center gap-2 rounded-full border border-white/10 bg-black/60 px-3 py-1.5 backdrop-blur-md"
            >
              <Text className="text-[10px] font-bold uppercase tracking-wider text-white/60">
                {t.label}
              </Text>
              <Text
                className={`font-mono text-sm font-medium ${
                  t.timeLeft === 0 ? "text-red-400" : "text-white"
                }`}
              >
                {formatTime(t.timeLeft)}
              </Text>
              <Pressable onPress={() => stopTimer(t.stepIndex)} className="ml-1">
                <X size={12} color="#a8a29e" />
              </Pressable>
            </Animated.View>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
};
