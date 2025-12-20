import React, { memo } from "react";
import { View, Text, useWindowDimensions } from "react-native";
import { Image } from "expo-image";
import Animated, {
  interpolate,
  useAnimatedStyle,
  Extrapolation,
  SharedValue,
} from "react-native-reanimated";
import { useTranslation } from "react-i18next";
import { useDeviceType } from "@/hooks/useDeviceType";
import type { Recipe } from "@/types/recipe";

interface RecipeHeaderProps {
  recipe: Recipe;
  isLoading?: boolean;
  isDraft?: boolean;
  isEditing?: boolean;
  onImageHeightChange?: (height: number) => void;
  scrollY?: SharedValue<number>;
}

export const RecipeHeader = memo(function RecipeHeader({
  recipe,
  isLoading = false,
  isDraft = false,
  isEditing = false,
  onImageHeightChange,
  scrollY,
}: RecipeHeaderProps) {
  const { t } = useTranslation();
  const { isTablet, isTabletLandscape } = useDeviceType();
  const { height: windowHeight } = useWindowDimensions();

  const imageAnimatedStyle = useAnimatedStyle(() => {
    if (!scrollY) return {};

    const scale = interpolate(scrollY.value, [-windowHeight, 0], [2, 1], Extrapolation.CLAMP);

    const translateY = interpolate(
      scrollY.value,
      [0, windowHeight],
      [0, -windowHeight],
      Extrapolation.CLAMP
    );

    return {
      transform: [{ translateY }, { scale }],
    };
  });

  const badgeAnimatedStyle = useAnimatedStyle(() => {
    if (!scrollY) return {};

    const translateY = interpolate(
      scrollY.value,
      [0, windowHeight],
      [0, -windowHeight],
      Extrapolation.CLAMP
    );

    return {
      transform: [{ translateY }],
    };
  });

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
        <Animated.View style={[{ width: "100%", height: "100%" }, imageAnimatedStyle]}>
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
        </Animated.View>

        {/* Draft Badge */}
        {(isDraft || isEditing) && (
          <Animated.View
            className={`absolute bottom-4 ${isTablet ? "left-8" : "left-4"}`}
            style={badgeAnimatedStyle}
          >
            <View className="rounded-full bg-surface-elevated/90 px-3 py-1.5 shadow-sm">
              <Text className="text-xs font-bold uppercase tracking-widest text-primary">
                {isEditing ? t("recipe.previewChanges") : t("recipe.draftPreview")}
              </Text>
            </View>
          </Animated.View>
        )}
      </View>
    </>
  );
});
