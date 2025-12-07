import React, { forwardRef } from "react";
import { View, Text, Pressable } from "react-native";
import { BottomSheetModal } from "@gorhom/bottom-sheet";
import { CheckIcon } from "phosphor-react-native";
import { useTranslation } from "react-i18next";

import { PremiumBottomSheet } from "@/components/ui/PremiumBottomSheet";

interface LanguageBottomSheetProps {
  currentLanguage: string;
  onLanguageChange: (lang: string) => void;
}

export const LanguageBottomSheet = forwardRef<
  BottomSheetModal,
  LanguageBottomSheetProps
>(function LanguageBottomSheet({ currentLanguage, onLanguageChange }, ref) {
  const { t } = useTranslation();

  const handleDismiss = () => {
    if (ref && "current" in ref && ref.current) {
      ref.current.dismiss();
    }
  };

  return (
    <PremiumBottomSheet
      ref={ref}
      snapPoints={["45%"]}
      title={t("settings.language.selectLanguage")}
      subtitle={t("settings.language.subtitle", "Applications Settings")}
      onClose={handleDismiss}
    >
      <View className="px-6 pb-8">
        {/* English */}
        <Pressable
          onPress={() => onLanguageChange("en")}
          className={`flex-row items-center py-4 px-5 rounded-2xl mb-3 border ${
            currentLanguage === "en"
              ? "bg-primary/5 border-primary/20"
              : "bg-transparent border-transparent active:bg-surface-elevated"
          }`}
        >
          <Text
            className={`flex-1 text-lg font-medium ${
              currentLanguage === "en"
                ? "text-primary-dark"
                : "text-foreground-heading"
            }`}
          >
            English
          </Text>
          {currentLanguage === "en" && (
            <View className="bg-primary rounded-full p-1">
              <CheckIcon size={14} color="#fff" weight="bold" />
            </View>
          )}
        </Pressable>

        {/* French */}
        <Pressable
          onPress={() => onLanguageChange("fr")}
          className={`flex-row items-center py-4 px-5 rounded-2xl mb-3 border ${
            currentLanguage === "fr"
              ? "bg-primary/5 border-primary/20"
              : "bg-transparent border-transparent active:bg-surface-elevated"
          }`}
        >
          <Text
            className={`flex-1 text-lg font-medium ${
              currentLanguage === "fr"
                ? "text-primary-dark"
                : "text-foreground-heading"
            }`}
          >
            Français
          </Text>
          {currentLanguage === "fr" && (
            <View className="bg-primary rounded-full p-1">
              <CheckIcon size={14} color="#fff" weight="bold" />
            </View>
          )}
        </Pressable>
      </View>
    </PremiumBottomSheet>
  );
});
