import React, { memo, useState } from "react";
import { View, Text, ScrollView } from "react-native";
import { useTranslation } from "react-i18next";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useDeviceType } from "@/hooks/useDeviceType";
import { ServingsSelector } from "@/components/recipe/shared/ServingsSelector";
import { RecipeIngredients } from "@/components/recipe/shared/RecipeIngredients";
import { RecipeInstructions } from "@/components/recipe/shared/RecipeInstructions";
import type { Recipe } from "@/types/recipe";
import { Skeleton } from "@/components/ui/Skeleton";

interface RecipeContentProps {
  recipe: Recipe;
  isLoading?: boolean;
  isTabletLandscape?: boolean;
}

export const RecipeContent = memo(function RecipeContent({
  recipe,
  isLoading,
  isTabletLandscape = false,
}: RecipeContentProps) {
  const { t } = useTranslation();
  const { isTablet } = useDeviceType();
  const insets = useSafeAreaInsets();
  const [servings, setServings] = useState(recipe.servings || 4);

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center">
        <Skeleton width="100%" height={16} borderRadius={12} style={{ marginBottom: 4 }} />
        <Skeleton width="100%" height={16} borderRadius={12} style={{ marginBottom: 4 }} />
        <Skeleton width="100%" height={16} borderRadius={12} style={{ marginBottom: 4 }} />
        <View></View>
        <Skeleton width="100%" height={16} borderRadius={12} style={{ marginBottom: 16 }} />
        <Skeleton width="100%" height={16} borderRadius={12} style={{ marginBottom: 16 }} />
        <Skeleton width="100%" height={16} borderRadius={12} style={{ marginBottom: 16 }} />
        <Skeleton width="100%" height={16} borderRadius={12} style={{ marginBottom: 16 }} />
        <Skeleton width="100%" height={16} borderRadius={12} style={{ marginBottom: 16 }} />
        <Skeleton width="100%" height={16} borderRadius={12} style={{ marginBottom: 16 }} />
        <Skeleton width="100%" height={16} borderRadius={12} style={{ marginBottom: 16 }} />

      </View>
    )
  }

  return (
    <ScrollView
      className={`${isTabletLandscape ? "w-[55%] bg-surface-elevated" : "w-full"} `}
      showsVerticalScrollIndicator={false}
      style={{ paddingTop: isTabletLandscape ? insets.top : 0 }}
    >
      <View className={`${isTablet ? "px-10 py-8" : "px-4 pb-8 pt-6"}`}>
        {/* Ingredients Section */}
        <View className="mb-12">
          <Text
            className="font-playfair-bold mb-2 text-2xl uppercase tracking-wide text-foreground-heading"
            style={{ fontFamily: "PlayfairDisplay_700Bold" }}
          >
            {t("recipe.ingredients").toUpperCase()}
          </Text>
          <Text className="mb-4 text-xs text-foreground-muted">{t("recipe.adjustServings")}</Text>

          {/* Servings Selector */}
          <ServingsSelector
            initialServings={recipe.servings || 4}
            currentServings={servings}
            onServingsChange={setServings}
          />
          <RecipeIngredients
            ingredients={recipe.ingredients}
            recipeServings={recipe.servings || 4}
            selectedServings={servings}
          />
        </View>

        {/* Instructions Section */}
        <RecipeInstructions instructions={recipe.instructions} />
      </View>
    </ScrollView>
  );
});