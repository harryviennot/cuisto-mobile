import React from "react";
import { View, Text, Pressable, ScrollView } from "react-native";
import { X } from "phosphor-react-native";
import Animated, { SlideInUp, FadeOut } from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import type { ActiveTimer } from "./hooks/useCookingController";

interface TimerDockProps {
  timers: ActiveTimer[];
  onStopTimer: (stepIndex: number) => void;
  onSelectTimer: (stepIndex: number) => void;
  formatTime: (seconds: number) => string;
}

export const TimerDock: React.FC<TimerDockProps> = ({
  timers,
  onStopTimer,
  onSelectTimer,
  formatTime,
}) => {
  if (timers.length === 0) return <View className="h-[50px]" />;

  return (
    <View className="z-10 py-2 h-[50px]">
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 24, gap: 8 }}
      >
        {timers.map((t) => (
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
              <Pressable onPress={() => onStopTimer(t.stepIndex)} className="ml-1">
                <X size={12} color="#a8a29e" />
              </Pressable>
            </Animated.View>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
};
