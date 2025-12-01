import { Text, ScrollView } from "react-native";
import { useTranslation } from "react-i18next";

import { OnboardingOptionCard } from "../OnboardingOptionCard";
import { COOKING_FREQUENCY_OPTIONS } from "../constants";

interface CookingFrequencyStepProps {
  selectedValue: string;
  onSelect: (value: string) => void;
  isAnimating: boolean;
}

export function CookingFrequencyStep({
  selectedValue,
  onSelect,
  isAnimating,
}: CookingFrequencyStepProps) {
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
        {t("onboarding.cookingFrequency.title")}
      </Text>
      <Text className="mb-6 text-base text-foreground-muted">
        {t("onboarding.cookingFrequency.subtitle")}
      </Text>

      {/* Options */}
      {COOKING_FREQUENCY_OPTIONS.map((option, index) => (
        <OnboardingOptionCard
          key={option.value}
          label={t(
            `onboarding.cookingFrequency.options.${option.value}.label` as any
          )}
          description={t(
            `onboarding.cookingFrequency.options.${option.value}.description` as any
          )}
          icon={option.icon}
          isSelected={selectedValue === option.value}
          onPress={() => onSelect(option.value)}
          disabled={isAnimating}
          className={
            index === COOKING_FREQUENCY_OPTIONS.length - 1 ? "mb-0" : "mb-6"
          }
        />
      ))}
    </ScrollView>
  );
}
