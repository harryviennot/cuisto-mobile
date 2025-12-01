/**
 * OnboardingControls - Bottom navigation bar for onboarding flow
 * Inspired by CookingControls but without the ingredients toggle
 * Features: back button + next/continue/finish button
 */
import React from "react";
import { View, Text, Pressable } from "react-native";
import { CaretLeft, CaretRight } from "phosphor-react-native";
import { useTranslation } from "react-i18next";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface OnboardingControlsProps {
  currentStep: number;
  totalSteps: number;
  canContinue: boolean;
  onPrevious: () => void;
  onNext: () => void;
  isAnimating?: boolean;
  isLastStep?: boolean;
}

export const OnboardingControls: React.FC<OnboardingControlsProps> = ({
  currentStep,
  totalSteps,
  canContinue,
  onPrevious,
  onNext,
  isAnimating = false,
  isLastStep = false,
}) => {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();

  const isFirstStep = currentStep === 0;

  return (
    <View
      className="z-50 flex-row items-stretch gap-4 border-t border-white/10 bg-black/80 px-6 pb-8 pt-6 backdrop-blur-lg"
      style={{ paddingBottom: insets.bottom + 16 }}
    >
      {/* Back button */}
      <Pressable
        onPress={onPrevious}
        disabled={isFirstStep || isAnimating}
        className={`h-16 w-16 items-center justify-center rounded-2xl bg-white/10 active:scale-95 ${
          isFirstStep || isAnimating ? "opacity-20" : "opacity-100"
        }`}
      >
        <CaretLeft size={28} color="white" />
      </Pressable>

      {/* Next/Continue/Finish button */}
      <Pressable
        onPress={onNext}
        disabled={!canContinue || isAnimating}
        className={`h-16 flex-1 flex-row items-center justify-center gap-2 rounded-2xl shadow-lg active:scale-95 ${
          canContinue && !isAnimating ? "bg-white" : "bg-white/30"
        }`}
      >
        <Text
          className={`text-lg font-bold ${
            canContinue && !isAnimating ? "text-primary" : "text-white/50"
          }`}
        >
          {isLastStep ? t("common.finish") : t("onboarding.continue")}
        </Text>
        <CaretRight
          size={24}
          color={canContinue && !isAnimating ? "#334d43" : "rgba(255,255,255,0.5)"}
          weight="bold"
        />
      </Pressable>
    </View>
  );
};
