import { View, Text } from "react-native";
import { useTranslation } from "react-i18next";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";

import type { OnboardingFormData } from "../types";
import React from "react";
import { FixedTextInput } from "@/components/forms/FixedTextInput";

interface BasicInfoStepProps {
  formData: OnboardingFormData;
  onFormDataChange: (data: Partial<OnboardingFormData>) => void;
}

export function BasicInfoStep({ formData, onFormDataChange }: BasicInfoStepProps) {
  const { t } = useTranslation();

  return (
    <KeyboardAwareScrollView
      // bottomOffset={48}
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
        <FixedTextInput
          className="rounded-xl border-2 border-border bg-white px-4 py-4 mb-4"
          placeholder={t("onboarding.basicInfo.namePlaceholder")}
          placeholderTextColor="#a8a29e"
          value={formData.display_name}
          onChangeText={(text) => onFormDataChange({ display_name: text })}
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
        <FixedTextInput
          className="rounded-xl border-2 border-border bg-white px-4 py-4 mb-4"
          placeholder={t("onboarding.basicInfo.agePlaceholder")}
          placeholderTextColor="#a8a29e"
          value={formData.age}
          onChangeText={(text) => {
            // Only allow numbers
            const numericText = text.replace(/[^0-9]/g, "");
            onFormDataChange({ age: numericText });
          }}
          keyboardType="number-pad"
          maxLength={3}
        />
      </View>
    </KeyboardAwareScrollView>
  );
}
