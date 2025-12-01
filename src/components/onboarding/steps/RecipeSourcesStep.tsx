import { Text, ScrollView } from "react-native";
import { useTranslation } from "react-i18next";

import { OnboardingOptionCard } from "../OnboardingOptionCard";
import { RECIPE_SOURCES_OPTIONS } from "../constants";

interface RecipeSourcesStepProps {
  selectedValues: string[];
  onToggle: (value: string) => void;
  isAnimating: boolean;
}

export function RecipeSourcesStep({
  selectedValues,
  onToggle,
  isAnimating,
}: RecipeSourcesStepProps) {
  const { t } = useTranslation();

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
          label={t(
            `onboarding.recipeSources.options.${option.value}.label` as any
          )}
          description={t(
            `onboarding.recipeSources.options.${option.value}.description` as any
          )}
          icon={option.icon}
          isSelected={selectedValues.includes(option.value)}
          onPress={() => onToggle(option.value)}
          disabled={isAnimating}
          className={
            index === RECIPE_SOURCES_OPTIONS.length - 1 ? "mb-0" : "mb-5"
          }
        />
      ))}
    </ScrollView>
  );
}
