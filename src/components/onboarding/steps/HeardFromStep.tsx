import { Text, ScrollView } from "react-native";
import { useTranslation } from "react-i18next";

import { OnboardingOptionCard } from "../OnboardingOptionCard";
import { HEARD_FROM_OPTIONS } from "../constants";

interface HeardFromStepProps {
  selectedValue: string;
  onSelect: (value: string) => void;
  isAnimating: boolean;
}

export function HeardFromStep({
  selectedValue,
  onSelect,
  isAnimating,
}: HeardFromStepProps) {
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
          description={t(
            `onboarding.heardFrom.options.${option.value}.description` as any
          )}
          icon={option.icon}
          isSelected={selectedValue === option.value}
          onPress={() => onSelect(option.value)}
          disabled={isAnimating}
          className={index === HEARD_FROM_OPTIONS.length - 1 ? "mb-0" : "mb-6"}
        />
      ))}
    </ScrollView>
  );
}
