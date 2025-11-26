import React from "react";
import { View, Pressable } from "react-native";
import { Stack, List } from "phosphor-react-native";
import { useTranslation } from "react-i18next";
import Animated, { AnimatedStyle } from "react-native-reanimated";

interface DrawerTabsProps {
  viewAllIngredients: boolean;
  onTabPress: (viewAll: boolean) => void;
  tabIndicatorStyle: AnimatedStyle;
}

export const DrawerTabs: React.FC<DrawerTabsProps> = ({
  viewAllIngredients,
  onTabPress,
  tabIndicatorStyle,
}) => {
  const { t } = useTranslation();

  return (
    <View
      className="px-6 pb-4"
      style={{
        zIndex: 10,
        paddingTop: 0
      }}
    >
      <View
        className="flex-row h-12 rounded-xl p-1 shadow-inner relative"
        style={{
          backgroundColor: "rgba(0, 0, 0, 0.2)",
          borderWidth: 1,
          borderColor: "rgba(255, 255, 255, 0.05)"
        }}
      >
        {/* Animated Background Pill */}
        <Animated.View
          style={[
            {
              position: 'absolute',
              top: 4,
              bottom: 4,
              left: 4,
              width: '50%',
              borderRadius: 8,
              backgroundColor: "#10b981", // emerald-500
              zIndex: 1,
            },
            tabIndicatorStyle
          ]}
        />

        <Pressable
          onPress={() => onTabPress(false)}
          className="flex-1 flex-row items-center justify-center gap-2 rounded-lg z-10"
        >
          <Stack
            size={14}
            weight="bold"
            color={!viewAllIngredients ? "#ffffff" : "#78716c"}
          />
          <Animated.Text
            className="text-[10px] font-bold uppercase tracking-widest"
            style={[{ color: !viewAllIngredients ? "#ffffff" : "#78716c" }]}
          >
            {t("recipe.cookingMode.thisStep")}
          </Animated.Text>
        </Pressable>

        <Pressable
          onPress={() => onTabPress(true)}
          className="flex-1 flex-row items-center justify-center gap-2 rounded-lg z-10"
        >
          <List
            size={14}
            weight="bold"
            color={viewAllIngredients ? "#ffffff" : "#78716c"}
          />
          <Animated.Text
            className="text-[10px] font-bold uppercase tracking-widest"
            style={[{ color: viewAllIngredients ? "#ffffff" : "#78716c" }]}
          >
            {t("recipe.cookingMode.allItems")}
          </Animated.Text>
        </Pressable>
      </View>
    </View>
  );
};
