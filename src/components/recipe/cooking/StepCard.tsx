import React from "react";
import { View, Text, Pressable, ScrollView } from "react-native";
import { Clock, Play, Pause, ArrowCounterClockwise } from "phosphor-react-native";
import { useTranslation } from "react-i18next";
import Animated, { SharedValue, interpolate, useAnimatedStyle } from "react-native-reanimated";
import { GestureDetector, Gesture, GestureType } from "react-native-gesture-handler";
import type { ActiveTimer } from "./hooks/useCookingController";
import { UpNext } from "./UpNext";

interface StepCardProps {
    step: any;
    currentTimer?: ActiveTimer;
    stepDurationSeconds: number;
    slideAnim: SharedValue<number>;
    width: number;
    panGesture: GestureType;
    onStartTimer: (stepIndex: number, duration: number, title: string) => void;
    onResetTimer: (stepIndex: number) => void;
    formatTime: (seconds: number) => string;
    currentStepIndex: number;
    nextStep: any;
    currentStep: any;
    totalSteps: number;
    nextStepAnim: SharedValue<number>;
}

export const StepCard: React.FC<StepCardProps> = ({
    step,
    currentTimer,
    stepDurationSeconds,
    slideAnim,
    width,
    panGesture,
    onStartTimer,
    onResetTimer,
    formatTime,
    currentStepIndex,
    nextStep,
    currentStep,
    totalSteps,
    nextStepAnim,
}) => {
    const { t } = useTranslation();

    const contentAnimatedStyle = useAnimatedStyle(() => {
        return {
            transform: [
                { translateX: interpolate(slideAnim.value, [-1, 0, 1], [-width, 0, width]) },
                { scale: interpolate(slideAnim.value, [-1, 0, 1], [0.9, 1, 0.9]) },
            ],
            opacity: interpolate(slideAnim.value, [-1, 0, 1], [0, 1, 0]),
        };
    });

    return (
        <GestureDetector gesture={panGesture}>
            <View className="flex-1 justify-between items-center px-4 py-4">

                <Animated.View
                    style={[
                        contentAnimatedStyle,
                        { height: "100%", maxHeight: 450, maxWidth: 650, width: "100%" },
                    ]}
                >
                    <View className="relative flex-1 overflow-hidden rounded-[32px] bg-[#FDFBF7] shadow-2xl">
                        {/* Step Number Watermark */}
                        <Text className="absolute -right-4 -top-4 font-playfair text-[120px] font-bold leading-none text-surface-texture-dark opacity-10">
                            {step.step_number}
                        </Text>

                        <ScrollView
                            className="flex-1"
                            contentContainerStyle={{ padding: 32, flexGrow: 1 }}
                            showsVerticalScrollIndicator={false}
                        >
                            {/* Group Header */}
                            {step.group && step.group !== "Main" && (
                                <View className="mb-4 flex-row items-center gap-3">
                                    <View className="h-px w-8 bg-primary/30" />
                                    <Text className="text-xs font-bold uppercase tracking-widest text-primary">
                                        {step.group}
                                    </Text>
                                </View>
                            )}

                            <Text
                                className="mb-6 pr-8 font-playfair text-4xl text-foreground-heading"
                                style={{ fontFamily: "PlayfairDisplay_700Bold" }}
                            >
                                {step.title}
                            </Text>
                            <Text className="mb-6 pr-8 text-2xl text-foreground-text leading-snug">
                                {step.description}
                            </Text>

                            {/* Spacer to push timer to bottom */}
                            <View className="flex-1" />

                            {/* Timer Control */}
                            {(step.timer_minutes || 0) > 0 && (
                                <View
                                    className={`mt-auto flex-row items-center justify-between rounded-2xl border-2 p-4 transition-all ${currentTimer?.isRunning
                                        ? "border-primary bg-primary/5"
                                        : "border-border bg-surface-elevated"
                                        }`}
                                >
                                    <View className="flex-row items-center gap-4">
                                        <View
                                            className={`h-12 w-12 items-center justify-center rounded-full ${currentTimer?.isRunning ? "bg-primary" : "bg-surface-texture-dark"
                                                }`}
                                        >
                                            <Clock
                                                size={24}
                                                color={currentTimer?.isRunning ? "white" : "#a8a29e"}
                                                weight={currentTimer?.isRunning ? "fill" : "regular"}
                                            />
                                        </View>
                                        <View>
                                            <Text className="text-xs font-bold uppercase tracking-wide text-foreground-muted">
                                                {currentTimer?.isRunning
                                                    ? t("recipe.cookingMode.timerRunning")
                                                    : t("recipe.cookingMode.recommendedTime")}
                                            </Text>
                                            <Text
                                                className={`font-mono text-2xl font-medium ${currentTimer?.isRunning
                                                    ? "text-primary"
                                                    : "text-foreground-heading"
                                                    }`}
                                            >
                                                {formatTime(
                                                    currentTimer ? currentTimer.timeLeft : stepDurationSeconds
                                                )}
                                            </Text>
                                        </View>
                                    </View>

                                    <View className="flex-row gap-2">
                                        {!currentTimer ? (
                                            <Pressable
                                                onPress={() =>
                                                    onStartTimer(
                                                        currentStepIndex,
                                                        step.timer_minutes,
                                                        step.title || `Step ${step.step_number}`
                                                    )
                                                }
                                                className="h-10 w-10 items-center justify-center rounded-full bg-primary shadow-lg active:scale-90"
                                            >
                                                <Play size={18} color="white" weight="fill" />
                                            </Pressable>
                                        ) : (
                                            <>
                                                {!currentTimer.isRunning && (
                                                    <Pressable
                                                        onPress={() => onResetTimer(currentStepIndex)}
                                                        className="h-10 w-10 items-center justify-center rounded-full bg-surface-texture-dark active:scale-90"
                                                    >
                                                        <ArrowCounterClockwise size={18} color="#78716c" />
                                                    </Pressable>
                                                )}
                                                <Pressable
                                                    onPress={() =>
                                                        onStartTimer(
                                                            currentStepIndex,
                                                            step.timer_minutes,
                                                            step.title || `Step ${step.step_number}`
                                                        )
                                                    }
                                                    className={`h-10 w-10 items-center justify-center rounded-full active:scale-90 ${currentTimer.isRunning ? "bg-orange-100" : "bg-primary"
                                                        }`}
                                                >
                                                    {currentTimer.isRunning ? (
                                                        <Pause size={18} color="#ea580c" weight="fill" />
                                                    ) : (
                                                        <Play size={18} color="white" weight="fill" />
                                                    )}
                                                </Pressable>
                                            </>
                                        )}
                                    </View>
                                </View>
                            )}
                        </ScrollView>
                    </View>
                </Animated.View>

                <UpNext
                    nextStep={nextStep}
                    currentStep={currentStep}
                    totalSteps={totalSteps}
                    nextStepAnim={nextStepAnim}
                />
            </View>

        </GestureDetector>
    );
};
