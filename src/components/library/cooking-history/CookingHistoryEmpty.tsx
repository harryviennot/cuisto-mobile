/**
 * Cooking History Empty State
 *
 * Displayed when the user has no cooking history yet.
 */
import React from "react";
import { View, Text, Pressable } from "react-native";
import { ClockClockwise } from "phosphor-react-native";
import { useTranslation } from "react-i18next";
import { router } from "expo-router";

export interface CookingHistoryEmptyProps {
  /** Whether this is displayed on the preview (compact) or full page */
  variant?: "preview" | "full";
}

export function CookingHistoryEmpty({ variant = "full" }: CookingHistoryEmptyProps) {
  const { t } = useTranslation();

  const handleBrowseRecipes = () => {
    // Navigate to the home/recipes tab
    router.push("/(tabs)");
  };

  if (variant === "preview") {
    return (
      <View className="items-center justify-center py-8 px-4">
        <ClockClockwise size={32} color="#a8a29e" weight="duotone" />
        <Text className="text-sm text-foreground-tertiary text-center mt-2">
          {t("cookingHistory.empty.message")}
        </Text>
      </View>
    );
  }

  return (
    <View className="flex-1 items-center justify-center px-8 py-16">
      <View className="w-20 h-20 rounded-full bg-stone-100 items-center justify-center mb-4">
        <ClockClockwise size={40} color="#78716c" weight="duotone" />
      </View>

      <Text className="text-xl font-playfair-bold text-foreground-heading text-center">
        {t("cookingHistory.empty.title")}
      </Text>

      <Text className="text-sm text-foreground-tertiary text-center mt-2 max-w-xs">
        {t("cookingHistory.empty.message")}
      </Text>

      <Pressable
        onPress={handleBrowseRecipes}
        className="mt-6 bg-primary rounded-full px-6 py-3 active:opacity-90"
      >
        <Text className="text-white font-semibold text-sm">{t("cookingHistory.empty.cta")}</Text>
      </Pressable>
    </View>
  );
}
