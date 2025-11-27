import React, { memo } from "react";
import { View, Text, useWindowDimensions } from "react-native";
import { Image } from "expo-image";
import { useTranslation } from "react-i18next";
import { useDeviceType } from "@/hooks/useDeviceType";
import type { Recipe } from "@/types/recipe";

interface RecipeHeaderProps {
  recipe: Recipe;
  isLoading?: boolean;
  isDraft?: boolean;
  isEditing?: boolean;
  onImageHeightChange?: (height: number) => void;
  onTitleLayout?: (layout: { y: number; height: number }) => void;
}

export const RecipeHeader = memo(function RecipeHeader({
  recipe,
  isLoading = false,
  isDraft = false,
  isEditing = false,
  onImageHeightChange,
  onTitleLayout,
}: RecipeHeaderProps) {
  const { t } = useTranslation();
  const { isTablet, isTabletLandscape } = useDeviceType();
  const { height: windowHeight } = useWindowDimensions();

  return (
    <>
      {/* Hero Image */}
      <View
        className={`relative w-full ${isTabletLandscape && !isEditing ? "flex-1" : isTablet ? "aspect-[5/3]" : "aspect-[5/4]"}`}
        style={isTabletLandscape && !isEditing ? { maxHeight: windowHeight * 0.5 } : undefined}
        onLayout={(event) => {
          const { height } = event.nativeEvent.layout;
          onImageHeightChange?.(height);
        }}
      >
        {recipe?.image_url ? (
          <Image
            source={{ uri: recipe.image_url }}
            style={{ width: "100%", height: "100%" }}
            contentFit="cover"
          />
        ) : (
          <View className="h-full w-full items-center justify-center bg-surface-texture-light">
            <Text className="text-foreground-tertiary">{t("recipe.noImage")}</Text>
          </View>
        )}

        {/* Draft Badge */}
        {(isDraft || isEditing) && (
          <View className={`absolute bottom-4 ${isTablet ? "left-8" : "left-4"}`}>
            <View className="rounded-full bg-surface-elevated/90 px-3 py-1.5 shadow-sm">
              <Text className="text-xs font-bold uppercase tracking-widest text-primary">
                {isEditing ? t("recipe.previewChanges") : t("recipe.draftPreview")}
              </Text>
            </View>
          </View>
        )}
      </View>

      {/* Title and Description */}
      <View className={`${isTablet ? "px-10 pt-8 pb-4" : "px-4 pt-6 pb-4"}`}>
        <Text
          className="font-playfair-bold mb-3 text-[32px] leading-tight text-foreground-heading"
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
    </>
  );
});
