/**
 * Multi-step onboarding questionnaire
 * Features:
 * - Blurred food photography background (like cooking mode)
 * - Progress bar indicator at top
 * - Cream-colored card with swipe animations
 * - Bottom navigation controls
 * - Auto-advance on single-select
 */
import { useState, useEffect, useCallback } from "react";
import { View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import Animated from "react-native-reanimated";
import { useTranslation } from "react-i18next";
import Toast from "react-native-toast-message";

import {
  OnboardingProgress,
  OnboardingBackground,
  OnboardingComplete,
  OnboardingControls,
  BasicInfoStep,
  HeardFromStep,
  CookingFrequencyStep,
  RecipeSourcesStep,
  useOnboardingAnimations,
  STEPS,
  TOTAL_QUESTION_STEPS,
} from "@/components/onboarding";
import type { OnboardingFormData } from "@/components/onboarding";
import { useAuth } from "@/contexts/AuthContext";

export default function Onboarding() {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const { submitOnboarding } = useAuth();

  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState<OnboardingFormData>({
    display_name: "",
    age: "",
    heard_from: "",
    cooking_frequency: "",
    recipe_sources: [],
  });

  const { contentAnimatedStyle, goToNextStep, goToPreviousStep, isAnimating } =
    useOnboardingAnimations({
      currentStep,
      setCurrentStep,
    });

  // Handle form data changes
  const handleFormDataChange = useCallback(
    (data: Partial<OnboardingFormData>) => {
      setFormData((prev) => ({ ...prev, ...data }));
    },
    []
  );

  // Handle single-select option
  const handleSingleSelect = useCallback(
    (field: "heard_from" | "cooking_frequency", value: string) => {
      setFormData((prev) => ({ ...prev, [field]: value }));
    },
    []
  );

  // Handle multi-select option (toggle)
  const handleMultiSelect = useCallback((value: string) => {
    setFormData((prev) => ({
      ...prev,
      recipe_sources: prev.recipe_sources.includes(value)
        ? prev.recipe_sources.filter((v) => v !== value)
        : [...prev.recipe_sources, value],
    }));
  }, []);

  // Submit onboarding data
  const handleSubmit = useCallback(async () => {
    setIsSubmitting(true);

    try {
      const ageNumber = formData.age ? parseInt(formData.age, 10) : undefined;

      await submitOnboarding({
        heard_from: formData.heard_from,
        cooking_frequency: formData.cooking_frequency,
        recipe_sources: formData.recipe_sources,
        display_name: formData.display_name.trim() || undefined,
        age: ageNumber && !isNaN(ageNumber) ? ageNumber : undefined,
      });

      Toast.show({
        type: "success",
        text1: t("common.welcome"),
        text2: "Your account is all set up",
      });

      // Navigation is handled automatically by ProtectedNavigation
      // after submitOnboarding updates the user's is_new_user flag
    } catch (err: unknown) {
      console.error("Onboarding submission error:", err);

      const errorMessage =
        err instanceof Error ? err.message : "Please try again";

      Toast.show({
        type: "error",
        text1: "Failed to complete setup",
        text2: errorMessage,
      });

      setIsSubmitting(false);
    }
  }, [formData, t, submitOnboarding]);

  // Check if current step can continue
  const canContinueCurrentStep = useCallback(() => {
    const stepId = STEPS[currentStep];
    switch (stepId) {
      case "basicInfo":
        return formData.display_name.trim().length > 0;
      case "heardFrom":
        return formData.heard_from !== "";
      case "cookingFrequency":
        return formData.cooking_frequency !== "";
      case "recipeSources":
        return formData.recipe_sources.length > 0;
      default:
        return true;
    }
  }, [currentStep, formData]);

  // Handle continue button press
  const handleContinue = useCallback(() => {
    const stepId = STEPS[currentStep];

    if (stepId === "recipeSources" && formData.recipe_sources.length === 0) {
      Toast.show({
        type: "error",
        text1: "Please select at least one",
        text2: "Where do you usually find recipes?",
      });
      return;
    }

    goToNextStep();
  }, [currentStep, formData.recipe_sources, goToNextStep]);

  // Trigger submit when reaching completion step
  useEffect(() => {
    if (STEPS[currentStep] === "completion" && !isSubmitting) {
      // Small delay to show completion animation
      const timer = setTimeout(() => {
        handleSubmit();
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [currentStep, isSubmitting, handleSubmit]);

  const stepId = STEPS[currentStep];
  const canContinue = canContinueCurrentStep();
  const isLastQuestionStep = currentStep === TOTAL_QUESTION_STEPS - 1;

  // Render step content inside the card
  const renderStepContent = () => {
    switch (stepId) {
      case "basicInfo":
        return (
          <BasicInfoStep
            formData={formData}
            onFormDataChange={handleFormDataChange}
          />
        );

      case "heardFrom":
        return (
          <HeardFromStep
            selectedValue={formData.heard_from}
            onSelect={(value) => handleSingleSelect("heard_from", value)}
            isAnimating={isAnimating}
          />
        );

      case "cookingFrequency":
        return (
          <CookingFrequencyStep
            selectedValue={formData.cooking_frequency}
            onSelect={(value) => handleSingleSelect("cooking_frequency", value)}
            isAnimating={isAnimating}
          />
        );

      case "recipeSources":
        return (
          <RecipeSourcesStep
            selectedValues={formData.recipe_sources}
            onToggle={handleMultiSelect}
            isAnimating={isAnimating}
          />
        );

      default:
        return null;
    }
  };

  // Completion screen (no card)
  if (stepId === "completion") {
    return (
      <View className="flex-1 bg-black">
        <StatusBar style="light" />
        <OnboardingBackground step={currentStep} />
        <OnboardingComplete
          displayName={formData.display_name}
          isSubmitting={isSubmitting}
        />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-black">
      <StatusBar style="light" />

      {/* Blurred background */}
      <OnboardingBackground step={currentStep} />

      {/* Content */}
      <View className="flex-1 gap-4" style={{ paddingTop: insets.top }}>
        {/* Progress bar */}
        <OnboardingProgress
          currentStep={currentStep}
          totalSteps={TOTAL_QUESTION_STEPS}
        />

        {/* Card container */}
        <Animated.View
          className="flex-1 items-center justify-center px-4"
          style={contentAnimatedStyle}
        >
          {/* Cream-colored card (like StepCard) - auto-sized to content */}
          <View className="w-full max-w-[500px] overflow-hidden rounded-[32px] bg-[#FDFBF7] shadow-2xl">
            {renderStepContent()}
          </View>
        </Animated.View>

        {/* Bottom controls */}
        <OnboardingControls
          currentStep={currentStep}
          totalSteps={TOTAL_QUESTION_STEPS}
          canContinue={canContinue}
          onPrevious={goToPreviousStep}
          onNext={handleContinue}
          isAnimating={isAnimating}
          isLastStep={isLastQuestionStep}
        />
      </View>
    </View>
  );
}
