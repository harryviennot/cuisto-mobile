import React from "react";
import { View, Text, Pressable } from "react-native";
import { X } from "phosphor-react-native";
import { useTranslation } from "react-i18next";

interface DrawerHeaderProps {
  viewAllIngredients: boolean;
  onToggle: () => void;
}

export const DrawerHeader: React.FC<DrawerHeaderProps> = ({ viewAllIngredients, onToggle }) => {
  const { t } = useTranslation();

  return (
    <View
      className="px-6 py-6"
      style={{
        zIndex: 10,
      }}
    >
      <View className="flex-row items-center justify-between">
        <View className="flex-1">
          <Text className="font-playfair-bold text-3xl tracking-tight text-stone-50">
            {t("recipe.ingredients")}
          </Text>
          <Text className="mt-1.5 text-[10px] font-bold uppercase tracking-widest text-stone-400/60">
            {viewAllIngredients
              ? t("recipe.cookingMode.allItems").toUpperCase()
              : t("recipe.cookingMode.requiredForThisStep").toUpperCase()}
          </Text>
        </View>
        <Pressable
          onPress={onToggle}
          className="active:scale-90"
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <X size={24} color="#a8a29e" weight="bold" />
        </Pressable>
      </View>
    </View>
  );
};
