import React, { useMemo } from "react";
import { View, Text, Pressable, Modal } from "react-native";
import { X, Pause, Play, ArrowCounterClockwise, Trash } from "phosphor-react-native";
import { useTranslation } from "react-i18next";
import Animated, { ZoomIn, ZoomOut } from "react-native-reanimated";
import { BlurView } from "expo-blur";
import { useTimerManager } from "./hooks/useTimerManager";

interface TimerControlModalProps {
  selectedTimerIndex: number | null;
  onClose: () => void;
}

/**
 * TimerControlModal - Modal for controlling individual timers
 * Now uses useTimerManager directly instead of prop drilling
 */
export const TimerControlModal: React.FC<TimerControlModalProps> = ({
  selectedTimerIndex,
  onClose,
}) => {
  const { t } = useTranslation();
  const { timers, resetTimer, toggleTimer, stopTimer, formatTime } = useTimerManager();

  // Derive selected timer from index
  const selectedTimer = useMemo(
    () => (selectedTimerIndex !== null ? timers.find((t) => t.stepIndex === selectedTimerIndex) : undefined),
    [timers, selectedTimerIndex]
  );

  return (
    <Modal visible={!!selectedTimer} transparent animationType="fade" onRequestClose={onClose}>
      <BlurView
        intensity={20}
        tint="dark"
        className="flex-1 items-center justify-center bg-black/40"
      >
        <Pressable className="absolute inset-0" onPress={onClose} />

        {selectedTimer && (
          <Animated.View
            entering={ZoomIn}
            exiting={ZoomOut}
            className="w-[80%] overflow-hidden rounded-3xl bg-surface-elevated p-6 shadow-2xl"
          >
            <View className="mb-6 flex-row items-center justify-between">
              <Text className="font-playfair text-xl font-bold text-foreground-heading">
                {selectedTimer.label}
              </Text>
              <Pressable onPress={onClose} className="rounded-full bg-surface-texture-light p-2">
                <X size={20} color="#78716c" />
              </Pressable>
            </View>

            <View className="mb-8 items-center">
              <Text
                className={`font-mono text-6xl font-medium ${
                  selectedTimer.isRunning ? "text-primary" : "text-foreground-heading"
                }`}
              >
                {formatTime(selectedTimer.timeLeft)}
              </Text>
              <Text className="mt-2 text-sm uppercase tracking-widest text-foreground-muted">
                {selectedTimer.isRunning
                  ? t("recipe.cookingMode.timerRunning")
                  : t("recipe.cookingMode.timerPaused")}
              </Text>
            </View>

            <View className="flex-row justify-center gap-6">
              <Pressable
                onPress={() => resetTimer(selectedTimer.stepIndex)}
                className="h-16 w-16 items-center justify-center rounded-full bg-surface-texture-dark active:scale-90"
              >
                <ArrowCounterClockwise size={24} color="#78716c" />
              </Pressable>

              <Pressable
                onPress={() => toggleTimer(selectedTimer.stepIndex)}
                className={`h-20 w-20 items-center justify-center rounded-full shadow-lg active:scale-90 ${
                  selectedTimer.isRunning ? "bg-orange-100" : "bg-primary"
                }`}
              >
                {selectedTimer.isRunning ? (
                  <Pause size={32} color="#ea580c" weight="fill" />
                ) : (
                  <Play size={32} color="white" weight="fill" />
                )}
              </Pressable>

              <Pressable
                onPress={() => stopTimer(selectedTimer.stepIndex)}
                className="h-16 w-16 items-center justify-center rounded-full bg-red-50 active:scale-90"
              >
                <Trash size={24} color="#ef4444" />
              </Pressable>
            </View>
          </Animated.View>
        )}
      </BlurView>
    </Modal>
  );
};
