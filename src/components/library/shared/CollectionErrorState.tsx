/**
 * Collection Error State
 *
 * Generic error state component with retry button.
 * Used when collection data fails to load.
 */
import React from "react";
import { View, Text, Pressable } from "react-native";
import { useTranslation } from "react-i18next";

export interface CollectionErrorStateProps {
  /** Custom error title (default: uses i18n library.error.title) */
  title?: string;
  /** Error message to display */
  errorMessage?: string;
  /** Callback when retry button is pressed */
  onRetry: () => void;
}

export function CollectionErrorState({ title, errorMessage, onRetry }: CollectionErrorStateProps) {
  const { t } = useTranslation();

  return (
    <View className="flex-1 items-center justify-center px-8">
      <Text className="font-playfair-bold text-xl text-foreground-heading text-center">
        {title || t("library.error.title")}
      </Text>
      <Text className="text-foreground-muted text-center mt-2 mb-6">
        {errorMessage || t("common.tryAgain")}
      </Text>
      <Pressable onPress={onRetry} className="bg-primary px-6 py-3 rounded-full active:opacity-90">
        <Text className="text-white font-semibold">{t("common.retry")}</Text>
      </Pressable>
    </View>
  );
}
