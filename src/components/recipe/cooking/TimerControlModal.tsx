import React, { useMemo } from "react";
import { View, Text, Pressable, Modal } from "react-native";
import { X, Pause, Play, ArrowCounterClockwise, Trash } from "phosphor-react-native";
import { useTranslation } from "react-i18next";
import Animated, { ZoomIn, ZoomOut } from "react-native-reanimated";
import { BlurView } from "expo-blur";
import type { ActiveTimer } from "./hooks/useTimerManager";

interface TimerControlModalProps {
  selectedTimerIndex: number | null;
  timers: ActiveTimer[];
  resetTimer: (stepIndex: number) => void;
  toggleTimer: (stepIndex: number) => void;
  stopTimer: (stepIndex: number) => void;
  formatTime: (seconds: number) => string;
  onClose: () => void;
}

/**
 * TimerControlModal - Modal for controlling individual timers
 * Receives all state as props to ensure single source of truth
 */
export const TimerControlModal: React.FC<TimerControlModalProps> = ({
  selectedTimerIndex,
  timers,
  resetTimer,
  toggleTimer,
  stopTimer,
  formatTime,
  onClose,
}) => {
  const { t } = useTranslation();

  // Derive selected timer from index
  const selectedTimer = useMemo(
    () =>
      selectedTimerIndex !== null
        ? timers.find((t) => t.stepIndex === selectedTimerIndex)
        : undefined,
    [timers, selectedTimerIndex]
  );

  return (
    <Modal visible={!!selectedTimer} transparent animationType="fade" onRequestClose={onClose}>
      <BlurView intensity={70} tint="dark" className="flex-1 items-center justify-center bg-black">
        <Pressable className="absolute inset-0" onPress={onClose} />

        {selectedTimer && (
          <Animated.View entering={ZoomIn} exiting={ZoomOut} className="w-[90%] max-w-[450px]">
            <BlurView intensity={90} tint="dark" className="rounded-3xl overflow-hidden">
              <View
                style={{
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 10 },
                  shadowOpacity: 0.5,
                  shadowRadius: 40,
                  padding: 24,
                }}
              >
                <View className="mb-6 flex-row items-center justify-between">
                  <Text className="font-playfair text-2xl font-bold text-stone-50">
                    {selectedTimer.label}
                  </Text>
                  <Pressable
                    onPress={onClose}
                    className="active:scale-90"
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <X size={24} color="#a8a29e" weight="bold" />
                  </Pressable>
                </View>

                <View className="mb-8 items-center">
                  <Text
                    className="font-mono text-6xl font-medium"
                    style={{
                      color: selectedTimer.isRunning ? "#34d399" : "#f5f5f4",
                    }}
                  >
                    {formatTime(selectedTimer.timeLeft)}
                  </Text>
                  <Text
                    className="mt-2 text-sm uppercase tracking-widest"
                    style={{ color: "#a8a29e" }}
                  >
                    {selectedTimer.isRunning
                      ? t("recipe.cookingMode.timerRunning")
                      : t("recipe.cookingMode.timerPaused")}
                  </Text>
                </View>

                <View className="flex-row justify-center gap-6">
                  <Pressable
                    onPress={() => resetTimer(selectedTimer.stepIndex)}
                    className="h-16 w-16 items-center justify-center rounded-full active:scale-90"
                    style={{ backgroundColor: "rgba(255, 255, 255, 0.1)" }}
                  >
                    <ArrowCounterClockwise size={24} color="#a8a29e" />
                  </Pressable>

                  <Pressable
                    onPress={() => toggleTimer(selectedTimer.stepIndex)}
                    className={`h-20 w-20 items-center justify-center rounded-full shadow-lg active:scale-90 ${
                      selectedTimer.isRunning ? "bg-orange-100" : "bg-emerald-500"
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
                    className="h-16 w-16 items-center justify-center rounded-full active:scale-90"
                    style={{ backgroundColor: "rgba(239, 68, 68, 0.15)" }}
                  >
                    <Trash size={24} color="#ef4444" />
                  </Pressable>
                </View>
              </View>
            </BlurView>
          </Animated.View>
        )}
      </BlurView>
    </Modal>
  );
};
