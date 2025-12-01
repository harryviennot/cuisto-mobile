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
import {
  View,
  Text,
  TextInput,
  ScrollView,
  useWindowDimensions,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  interpolate,
  useDerivedValue,
  runOnJS,
  Easing,
} from "react-native-reanimated";
import { useTranslation } from "react-i18next";
import {
  Megaphone,
  Storefront,
  Article,
  MagnifyingGlass,
  DotsThree,
  CookingPot,
  Timer,
  CalendarBlank,
  Fire,
  TiktokLogo,
  InstagramLogo,
  YoutubeLogo,
  BookOpen,
  BookBookmark,
  UsersThree,
} from "phosphor-react-native";
import Toast from "react-native-toast-message";

import {
  OnboardingProgress,
  OnboardingOptionCard,
  OnboardingBackground,
  OnboardingComplete,
  OnboardingControls,
} from "@/components/onboarding";
import { authService } from "@/api/services/auth.service";
import type { Icon } from "phosphor-react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";

// Step definitions
type StepId = "basicInfo" | "heardFrom" | "cookingFrequency" | "recipeSources" | "completion";

interface OnboardingFormData {
  display_name: string;
  age: string;
  heard_from: string;
  cooking_frequency: string;
  recipe_sources: string[];
}

interface OptionConfig {
  value: string;
  icon: Icon;
}

// Option configurations with icons
const HEARD_FROM_OPTIONS: OptionConfig[] = [
  { value: "social_media", icon: Megaphone },
  { value: "friend", icon: UsersThree },
  { value: "app_store", icon: Storefront },
  { value: "blog", icon: Article },
  { value: "search_engine", icon: MagnifyingGlass },
  { value: "other", icon: DotsThree },
];

const COOKING_FREQUENCY_OPTIONS: OptionConfig[] = [
  { value: "rarely", icon: CalendarBlank },
  { value: "occasionally", icon: Timer },
  { value: "regularly", icon: CookingPot },
  { value: "almost_daily", icon: Fire },
];

const RECIPE_SOURCES_OPTIONS: OptionConfig[] = [
  { value: "tiktok", icon: TiktokLogo },
  { value: "instagram", icon: InstagramLogo },
  { value: "youtube", icon: YoutubeLogo },
  { value: "blogs", icon: Article },
  { value: "cookbooks", icon: BookBookmark },
  { value: "family", icon: UsersThree },
  { value: "other", icon: BookOpen },
];

const STEPS: StepId[] = ["basicInfo", "heardFrom", "cookingFrequency", "recipeSources", "completion"];
const TOTAL_QUESTION_STEPS = STEPS.length - 1; // Exclude completion step from count

export default function Onboarding() {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const { width } = useWindowDimensions();

  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  const [formData, setFormData] = useState<OnboardingFormData>({
    display_name: "",
    age: "",
    heard_from: "",
    cooking_frequency: "",
    recipe_sources: [],
  });

  // Animation values (like cooking mode)
  const slideAnim = useSharedValue(0);

  // Derived animation values for content
  const contentTranslateX = useDerivedValue(() => {
    return interpolate(slideAnim.value, [-1, 0, 1], [-width, 0, width]);
  });

  const contentScale = useDerivedValue(() => {
    return interpolate(slideAnim.value, [-1, 0, 1], [0.9, 1, 0.9]);
  });

  const contentOpacity = useDerivedValue(() => {
    return interpolate(slideAnim.value, [-1, 0, 1], [0, 1, 0]);
  });

  const contentAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: contentTranslateX.value },
      { scale: contentScale.value },
    ],
    opacity: contentOpacity.value,
  }));

  // Navigate to next step with slide animation
  const goToNextStep = useCallback(() => {
    if (isAnimating || currentStep >= STEPS.length - 1) return;

    setIsAnimating(true);

    // Slide out to the left
    slideAnim.value = withTiming(-1, { duration: 250, easing: Easing.out(Easing.cubic) }, () => {
      runOnJS(setCurrentStep)(currentStep + 1);
      // Reset to right side
      slideAnim.value = 1;
      // Slide in from right
      slideAnim.value = withTiming(0, { duration: 300, easing: Easing.out(Easing.cubic) }, () => {
        runOnJS(setIsAnimating)(false);
      });
    });
  }, [currentStep, isAnimating, slideAnim]);

  // Navigate to previous step with slide animation
  const goToPreviousStep = useCallback(() => {
    if (isAnimating || currentStep <= 0) return;

    setIsAnimating(true);

    // Slide out to the right
    slideAnim.value = withTiming(1, { duration: 250, easing: Easing.out(Easing.cubic) }, () => {
      runOnJS(setCurrentStep)(currentStep - 1);
      // Reset to left side
      slideAnim.value = -1;
      // Slide in from left
      slideAnim.value = withTiming(0, { duration: 300, easing: Easing.out(Easing.cubic) }, () => {
        runOnJS(setIsAnimating)(false);
      });
    });
  }, [currentStep, isAnimating, slideAnim]);

  // Handle single-select option (no auto-advance - user controls navigation)
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

      await authService.submitOnboarding({
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

      // Navigate to main app
      router.replace("/(tabs)");
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
  }, [formData, t]);

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
          <KeyboardAwareScrollView
            bottomOffset={48}
            contentContainerStyle={{ padding: 24 }}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Title */}
            <Text
              className="mb-2 text-3xl text-foreground-heading"
              style={{ fontFamily: "PlayfairDisplay_700Bold" }}
            >
              {t("onboarding.basicInfo.title")}
            </Text>
            <Text className="mb-8 text-base text-foreground-muted">
              {t("onboarding.basicInfo.subtitle")}
            </Text>

            {/* Name input */}
            <View className="mb-6">
              <Text className="mb-2 text-sm font-medium text-foreground-secondary">
                {t("onboarding.basicInfo.nameLabel")}
              </Text>
              <TextInput
                className="rounded-xl border-2 border-border bg-white px-4 py-4 text-base text-foreground-heading"
                placeholder={t("onboarding.basicInfo.namePlaceholder")}
                placeholderTextColor="#a8a29e"
                value={formData.display_name}
                onChangeText={(text) => setFormData((prev) => ({ ...prev, display_name: text }))}
                autoCapitalize="words"
                autoCorrect={false}
                returnKeyType="next"
              />
            </View>

            {/* Age input */}
            <View>
              <Text className="mb-2 text-sm font-medium text-foreground-secondary">
                {t("onboarding.basicInfo.ageLabel")}
              </Text>
              <TextInput
                className="rounded-xl border-2 border-border bg-white px-4 py-4 text-base text-foreground-heading"
                placeholder={t("onboarding.basicInfo.agePlaceholder")}
                placeholderTextColor="#a8a29e"
                value={formData.age}
                onChangeText={(text) => {
                  // Only allow numbers
                  const numericText = text.replace(/[^0-9]/g, "");
                  setFormData((prev) => ({ ...prev, age: numericText }));
                }}
                keyboardType="number-pad"
                maxLength={3}
              // returnKeyType="done"
              />
            </View>

          </KeyboardAwareScrollView>
        );

      case "heardFrom":
        return (
          <ScrollView
            contentContainerStyle={{ padding: 24 }}
            showsVerticalScrollIndicator={false}
          >
            {/* Title */}
            <Text
              className="mb-2 text-3xl text-foreground-heading"
              style={{ fontFamily: "PlayfairDisplay_700Bold" }}
            >
              {t("onboarding.heardFrom.title")}
            </Text>
            <Text className="mb-6 text-base text-foreground-muted">
              {t("onboarding.heardFrom.subtitle")}
            </Text>

            {/* Options */}
            {HEARD_FROM_OPTIONS.map((option, index) => (
              <OnboardingOptionCard
                key={option.value}
                label={t(`onboarding.heardFrom.options.${option.value}.label` as any)}
                description={t(`onboarding.heardFrom.options.${option.value}.description` as any)}
                icon={option.icon}
                isSelected={formData.heard_from === option.value}
                onPress={() => handleSingleSelect("heard_from", option.value)}
                disabled={isAnimating}
                className={index === HEARD_FROM_OPTIONS.length - 1 ? "mb-0" : "mb-6"}
              />
            ))}
          </ScrollView>
        );

      case "cookingFrequency":
        return (
          <ScrollView
            contentContainerStyle={{ padding: 24 }}
            showsVerticalScrollIndicator={false}
          >
            {/* Title */}
            <Text
              className="mb-2 text-3xl text-foreground-heading"
              style={{ fontFamily: "PlayfairDisplay_700Bold" }}
            >
              {t("onboarding.cookingFrequency.title")}
            </Text>
            <Text className="mb-6 text-base text-foreground-muted">
              {t("onboarding.cookingFrequency.subtitle")}
            </Text>

            {/* Options */}
            {COOKING_FREQUENCY_OPTIONS.map((option, index) => (
              <OnboardingOptionCard
                key={option.value}
                label={t(`onboarding.cookingFrequency.options.${option.value}.label` as any)}
                description={t(`onboarding.cookingFrequency.options.${option.value}.description` as any)}
                icon={option.icon}
                isSelected={formData.cooking_frequency === option.value}
                onPress={() => handleSingleSelect("cooking_frequency", option.value)}
                disabled={isAnimating}
                className={index === COOKING_FREQUENCY_OPTIONS.length - 1 ? "mb-0" : "mb-6"}
              />
            ))}
          </ScrollView>
        );

      case "recipeSources":
        return (
          <ScrollView
            contentContainerStyle={{ padding: 24 }}
            showsVerticalScrollIndicator={false}
          >
            {/* Title */}
            <Text
              className="mb-2 text-3xl text-foreground-heading"
              style={{ fontFamily: "PlayfairDisplay_700Bold" }}
            >
              {t("onboarding.recipeSources.title")}
            </Text>
            <Text className="mb-6 text-base text-foreground-muted">
              {t("onboarding.recipeSources.subtitle")}
            </Text>

            {/* Options (multi-select) */}
            {RECIPE_SOURCES_OPTIONS.map((option, index) => (
              <OnboardingOptionCard
                key={option.value}
                label={t(`onboarding.recipeSources.options.${option.value}.label` as any)}
                description={t(`onboarding.recipeSources.options.${option.value}.description` as any)}
                icon={option.icon}
                isSelected={formData.recipe_sources.includes(option.value)}
                onPress={() => handleMultiSelect(option.value)}
                disabled={isAnimating}
                className={index === RECIPE_SOURCES_OPTIONS.length - 1 ? "mb-0" : "mb-5"}
              />
            ))}
          </ScrollView>
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
        <OnboardingComplete displayName={formData.display_name} isSubmitting={isSubmitting} />
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
        <OnboardingProgress currentStep={currentStep} totalSteps={TOTAL_QUESTION_STEPS} />

        {/* Card container */}
        <Animated.View
          className="flex-1 justify-center items-center px-4 border border-blue-500"
          style={contentAnimatedStyle}
        >
          {/* Cream-colored card (like StepCard) - auto-sized to content */}
          <View className="overflow-hidden rounded-[32px] bg-[#FDFBF7] shadow-2xl max-w-[500px] w-full">
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
