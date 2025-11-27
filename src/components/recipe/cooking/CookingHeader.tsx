import React from "react";
import { View, Text, Pressable } from "react-native";
import { X, Sparkle } from "phosphor-react-native";
import { useTranslation } from "react-i18next";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface CookingHeaderProps {
  currentStep: number;
  totalSteps: number;
  onClose: () => void;
  onToggleChat: () => void;
}

export const CookingHeader: React.FC<CookingHeaderProps> = ({
  currentStep,
  totalSteps,
  onClose,
  onToggleChat,
}) => {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();

  return (
    <View
      className="z-10 flex-row items-center justify-between px-6 pb-2"
      style={{ paddingTop: insets.top + 12 }}
    >
      <Pressable onPress={onClose} className="-ml-2 rounded-full p-2 active:bg-white/10">
        <X size={24} color="white" />
      </Pressable>

      <View className="items-center">
        <Text className="text-xs font-bold uppercase tracking-widest text-white/80">
          {t("recipe.cookingMode.step")} {currentStep + 1} {t("common.of")} {totalSteps}
        </Text>
        <View className="mt-2 flex-row gap-1">
          {Array.from({ length: totalSteps }).map((_, idx) => (
            <View
              key={idx}
              className={`h-1 rounded-full transition-all ${
                idx === currentStep
                  ? "w-6 bg-white"
                  : idx < currentStep
                    ? "w-1.5 bg-white/60"
                    : "w-1.5 bg-white/20"
              }`}
            />
          ))}
        </View>
      </View>

      <Pressable
        onPress={onToggleChat}
        className="rounded-full border border-white/10 bg-white/10 p-2 backdrop-blur-md active:bg-white/20"
      >
        <Sparkle size={20} color="white" weight="fill" />
      </Pressable>
    </View>
  );
};
