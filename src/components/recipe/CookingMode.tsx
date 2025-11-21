/**
 * Cooking Mode - Step-by-step cooking interface
 * Full-screen immersive mode for following recipe instructions
 */
import React, { useState } from "react";
import {
  View,
  Text,
  Pressable,
  ScrollView,
  useWindowDimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  X,
  Check,
  CaretLeft,
  CaretRight,
  Clock,
} from "phosphor-react-native";
import { useTranslation } from "react-i18next";
import Animated, { FadeIn, FadeOut, SlideInRight, SlideOutLeft } from "react-native-reanimated";
import type { Recipe } from "@/types/recipe";

interface CookingModeProps {
  recipe: Recipe;
  onClose: () => void;
}

export const CookingMode: React.FC<CookingModeProps> = ({ recipe, onClose }) => {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());

  const instructions = recipe.instructions.sort((a, b) => a.step_number - b.step_number);
  const totalSteps = instructions.length;
  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === totalSteps - 1;
  const currentInstruction = instructions[currentStep];

  const handleNext = () => {
    if (!isLastStep) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (!isFirstStep) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleToggleComplete = () => {
    const newCompleted = new Set(completedSteps);
    if (completedSteps.has(currentStep)) {
      newCompleted.delete(currentStep);
    } else {
      newCompleted.add(currentStep);
    }
    setCompletedSteps(newCompleted);
  };

  const handleClose = () => {
    onClose();
  };

  const isStepComplete = completedSteps.has(currentStep);
  const progressPercentage = ((completedSteps.size / totalSteps) * 100).toFixed(0);

  return (
    <View className="flex-1 bg-surface" style={{ paddingTop: insets.top }}>
      {/* Header */}
      <View className="border-b border-border-light bg-surface-elevated px-6 py-4">
        <View className="flex-row items-center justify-between">
          <View className="flex-1">
            <Text className="mb-1 text-xs font-medium uppercase tracking-wide text-foreground-muted">
              {t("recipe.cookingMode.title")}
            </Text>
            <Text className="text-lg font-bold text-foreground-heading" numberOfLines={1}>
              {recipe.title}
            </Text>
          </View>
          <Pressable
            onPress={handleClose}
            className="ml-4 h-10 w-10 items-center justify-center rounded-full bg-surface-elevated active:bg-surface-texture-light"
          >
            <X size={24} color="#3a3226" weight="bold" />
          </Pressable>
        </View>

        {/* Progress Bar */}
        <View className="mt-4">
          <View className="mb-2 flex-row items-center justify-between">
            <Text className="text-xs font-medium text-foreground">
              {t("recipe.cookingMode.step")} {currentStep + 1} {t("common.of")} {totalSteps}
            </Text>
            <Text className="text-xs font-medium text-primary">
              {progressPercentage}{t("recipe.cookingMode.percentComplete")}
            </Text>
          </View>
          <View className="h-2 overflow-hidden rounded-full bg-surface-texture-light">
            <Animated.View
              entering={FadeIn}
              className="h-full bg-primary"
              style={{ width: `${progressPercentage}%` }}
            />
          </View>
        </View>
      </View>

      {/* Step Content */}
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 24, paddingVertical: 32 }}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View
          key={currentStep}
          entering={SlideInRight.duration(300)}
          exiting={SlideOutLeft.duration(300)}
          className="flex-1"
        >
          {/* Step Number Badge */}
          <View className="mb-6 flex-row items-center gap-4">
            <View className="h-16 w-16 items-center justify-center rounded-full border-4 border-primary bg-surface-elevated shadow-lg">
              <Text className="text-2xl font-bold text-primary">
                {currentInstruction.step_number}
              </Text>
            </View>

            {currentInstruction.timer_minutes && (
              <View className="flex-row items-center gap-2 rounded-full bg-orange-50 px-4 py-2">
                <Clock size={20} color="#f97316" weight="bold" />
                <Text className="text-sm font-bold text-orange-600">
                  {currentInstruction.timer_minutes} {t("common.minutes")}
                </Text>
              </View>
            )}
          </View>

          {/* Instruction Text */}
          <Text className="mb-8 text-2xl font-bold leading-tight text-foreground-heading">
            {currentInstruction.text}
          </Text>

          {/* Group Context */}
          {currentInstruction.group && currentInstruction.group !== "Main" && (
            <View className="mb-6 rounded-xl bg-surface-elevated p-4">
              <Text className="text-xs font-bold uppercase tracking-widest text-foreground-muted">
                {currentInstruction.group}
              </Text>
            </View>
          )}

          {/* Ingredients for this step (if we had them linked) */}
          {/* This would require backend changes to link ingredients to steps */}

          {/* Complete Step Button */}
          <Pressable
            onPress={handleToggleComplete}
            className={`mb-6 flex-row items-center justify-center gap-3 rounded-xl px-6 py-4 active:scale-[0.98] ${
              isStepComplete ? "bg-state-success/10 border-2 border-state-success" : "bg-surface-elevated border-2 border-border"
            }`}
          >
            <View
              className={`h-6 w-6 items-center justify-center rounded-full ${
                isStepComplete ? "bg-state-success" : "bg-surface-elevated"
              }`}
            >
              {isStepComplete && <Check size={16} color="#FFFFFF" weight="bold" />}
            </View>
            <Text
              className={`text-base font-bold ${
                isStepComplete ? "text-state-success" : "text-foreground-secondary"
              }`}
            >
              {isStepComplete ? t("recipe.cookingMode.stepCompleted") : t("recipe.cookingMode.markAsComplete")}
            </Text>
          </Pressable>

          {/* Helpful Tips (placeholder for future enhancement) */}
          {/* Could show tips, alternative techniques, or warnings */}
        </Animated.View>
      </ScrollView>

      {/* Navigation Footer */}
      <View
        className="border-t border-border-light bg-surface-elevated px-6 py-4"
        style={{ paddingBottom: insets.bottom + 16 }}
      >
        <View className="flex-row gap-3">
          {/* Previous Button */}
          <Pressable
            onPress={handlePrevious}
            disabled={isFirstStep}
            className={`flex-1 flex-row items-center justify-center gap-2 rounded-xl border-2 py-4 ${
              isFirstStep
                ? "border-border-light bg-surface-elevated"
                : "border-border bg-surface-elevated active:bg-surface-elevated"
            }`}
          >
            <CaretLeft
              size={24}
              color={isFirstStep ? "#b8afa1" : "#6b5f4e"}
              weight="bold"
            />
            <Text
              className={`text-base font-bold ${
                isFirstStep ? "text-foreground-tertiary" : "text-foreground-secondary"
              }`}
            >
              {t("common.previous")}
            </Text>
          </Pressable>

          {/* Next Button */}
          <Pressable
            onPress={isLastStep ? handleClose : handleNext}
            className="flex-1 flex-row items-center justify-center gap-2 rounded-xl bg-primary py-4 active:opacity-90"
          >
            <Text className="text-base font-bold text-white">
              {isLastStep ? t("common.finish") : t("recipe.cookingMode.nextStep")}
            </Text>
            {!isLastStep && <CaretRight size={24} color="#FFFFFF" weight="bold" />}
          </Pressable>
        </View>

        {/* Step Dots Indicator */}
        <View className="mt-4 flex-row items-center justify-center gap-2">
          {instructions.map((_, idx) => (
            <Pressable
              key={idx}
              onPress={() => setCurrentStep(idx)}
              className={`h-2 rounded-full ${
                idx === currentStep
                  ? "w-8 bg-primary"
                  : completedSteps.has(idx)
                    ? "w-2 bg-state-success"
                    : "w-2 bg-surface-texture-light"
              }`}
            />
          ))}
        </View>
      </View>
    </View>
  );
};
