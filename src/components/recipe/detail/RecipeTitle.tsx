import React, { memo } from "react";
import { View, Text } from "react-native";
import { useDeviceType } from "@/hooks/useDeviceType";
import type { Recipe } from "@/types/recipe";

interface RecipeTitleProps {
  recipe: Recipe;
  onTitleLayout?: (layout: { y: number; height: number }) => void;
}

export const RecipeTitle = memo(function RecipeTitle({
  recipe,
  onTitleLayout,
}: RecipeTitleProps) {
  const { isTablet } = useDeviceType();

  return (
    <View className={`${isTablet ? "px-10 pt-8 pb-4" : "px-4 pt-6 pb-4"} relative`}>
      <Text
        className="font-playfair-bold mb-3 text-[32px] leading-tight text-foreground-heading"
        numberOfLines={3}
        adjustsFontSizeToFit
        style={{ fontFamily: "PlayfairDisplay_700Bold" }}
        onLayout={(event) => {
          const { y, height } = event.nativeEvent.layout;
          onTitleLayout?.({ y, height });
        }}
      >
        {recipe.title}
      </Text>

      {/* Description */}
      {recipe.description && (
        <Text className="mb-6 leading-relaxed text-foreground">{recipe.description}</Text>
      )}
    </View>
  );
});
