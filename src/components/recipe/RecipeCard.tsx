/**
 * Recipe card component for displaying recipe in grid view
 * Editorial Pinterest-style design with glassmorphism
 */
import { memo, useState } from "react";
import { View, Text, Pressable, Platform } from "react-native";
import { Image } from "expo-image";
import { router } from "expo-router";
import { Image as ImageIcon, Clock, Bookmark, Fire, Users } from "phosphor-react-native";
import { BlurView } from "expo-blur";
import { useTranslation } from "react-i18next";
import * as Haptics from "expo-haptics";
import type { Recipe } from "@/types/recipe";
import { Skeleton } from "../ui/Skeleton";
import { useToggleFavorite } from "@/hooks/useCollections";
import { formatDuration } from "@/utils/formatDuration";

interface StatsBadge {
  type: "cooking" | "extraction";
  count: number;
}

interface RecipeCardProps {
  recipe: Recipe;
  index: number;
  width?: number;
  imageHeight?: number;
  statsBadge?: StatsBadge;
}

export const RecipeCard = memo(function RecipeCard({
  recipe,
  width,
  imageHeight: fixedImageHeight,
  statsBadge,
}: RecipeCardProps) {
  const { t } = useTranslation();
  const [imageLoading, setImageLoading] = useState(true);
  const { mutate: toggleFavorite } = useToggleFavorite();

  // Get favorite status from user_data
  const isFavorite = recipe.user_data?.is_favorite ?? false;

  const handleBookmarkPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    toggleFavorite({ recipeId: recipe.id, isFavorite });
  };

  const handlePress = () => {
    // Navigate to recipe detail page with optimistic data
    router.push({
      pathname: `/recipe/[id]` as const,
      params: {
        id: recipe.id,
        title: recipe.title,
        ...(recipe.image_url && { imageUrl: recipe.image_url }),
      },
    });
  };

  // Calculate total time
  const totalTime =
    recipe.timings?.total_time_minutes ||
    (recipe.timings?.prep_time_minutes || 0) + (recipe.timings?.cook_time_minutes || 0);

  // Get difficulty dot color
  const getDifficultyDotColor = (difficulty?: string) => {
    switch (difficulty?.toLowerCase()) {
      case "easy":
        return "bg-emerald-400";
      case "medium":
        return "bg-yellow-400";
      case "hard":
        return "bg-rose-400";
      default:
        return "bg-stone-400";
    }
  };

  // Calculate variable image height for Pinterest effect
  const getImageHeight = () => {
    const hash = recipe.id.split("").reduce((acc, char) => {
      return acc + char.charCodeAt(0);
    }, 0);

    const heightVariations = [200, 220, 240, 260, 280];
    const baseHeight = heightVariations[hash % heightVariations.length];
    const offset = (hash * 17) % 40;

    return baseHeight + offset;
  };

  const imageHeight = fixedImageHeight ?? getImageHeight();

  // Get category label from i18n translations, fallback to 'Recipe'
  const categoryLabel = recipe.category?.slug
    ? t("categories." + recipe.category.slug, { defaultValue: recipe.category.slug })
    : "RECIPE";

  // Get translated difficulty label
  const getDifficultyLabel = (difficulty?: string) => {
    switch (difficulty?.toLowerCase()) {
      case "easy":
        return t("recipe.difficulty.easy");
      case "medium":
        return t("recipe.difficulty.medium");
      case "hard":
        return t("recipe.difficulty.hard");
      default:
        return null;
    }
  };

  return (
    <View className="mb-6" style={width ? { width } : undefined}>
      <Pressable onPress={handlePress} className="relative active:opacity-90">
        {/* Image Container */}
        <View
          className="relative w-full overflow-hidden rounded-2xl bg-stone-200"
          style={{
            height: imageHeight,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.08,
            shadowRadius: 4,
            elevation: 2,
          }}
        >
          {recipe.image_url ? (
            <>
              {/* Loading Skeleton */}
              {imageLoading && (
                <View className="absolute inset-0 z-10">
                  <Skeleton width="100%" height="100%" borderRadius={0} />
                </View>
              )}
              {/* Image */}
              <Image
                source={{ uri: recipe.image_url }}
                style={{ width: "100%", height: "100%" }}
                contentFit="cover"
                transition={200}
                cachePolicy="memory-disk"
                priority="high"
                onLoadStart={() => setImageLoading(true)}
                onLoad={() => setImageLoading(false)}
                onError={() => setImageLoading(false)}
              />
            </>
          ) : (
            <View className="w-full h-full items-center justify-center gap-2">
              <ImageIcon size={48} color="#a8a29e" weight="duotone" />
              <Text className="text-stone-400 text-sm">{t("recipe.card.noImage")}</Text>
            </View>
          )}

          {/* Floating Bookmark Button with Glassmorphism */}
          <View className="absolute top-2 right-2">
            {Platform.OS === "ios" ? (
              <BlurView
                intensity={20}
                tint="light"
                className="h-10 w-10 rounded-full overflow-hidden border border-white/20"
              >
                <Pressable
                  className="h-full w-full items-center justify-center active:opacity-70"
                  hitSlop={10}
                  onPress={(e) => {
                    e.stopPropagation();
                    handleBookmarkPress();
                  }}
                >
                  <Bookmark size={18} color="#ffffff" weight={isFavorite ? "fill" : "regular"} />
                </Pressable>
              </BlurView>
            ) : (
              // Fallback for Android
              <Pressable
                className="h-8 w-8 bg-white/20 rounded-full items-center justify-center border border-white/20 active:opacity-70"
                style={{
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 0.1,
                  shadowRadius: 2,
                  elevation: 2,
                }}
                onPress={(e) => {
                  e.stopPropagation();
                  handleBookmarkPress();
                }}
              >
                <Bookmark size={14} color="#ffffff" weight={isFavorite ? "fill" : "regular"} />
              </Pressable>
            )}
          </View>

          {/* Stats Badge Overlay */}
          {statsBadge && (
            <View className="absolute bottom-2 left-2 right-2">
              <View className="flex-row items-center bg-black/60 px-2 py-1 rounded-full self-start">
                {statsBadge.type === "cooking" ? (
                  <Fire size={12} weight="fill" color="#f97316" />
                ) : (
                  <Users size={12} weight="fill" color="#6366f1" />
                )}
                <Text className="text-white text-xs ml-1 font-medium">
                  {statsBadge.count} {statsBadge.type === "cooking" ? "cooked" : "extracted"}
                </Text>
              </View>
            </View>
          )}
        </View>

        {/* Content Area - Minimalist & Editorial */}
        <View className="mt-3 px-1">
          {/* Category and Rating Row */}
          <View className="flex-row items-center justify-between mb-1">
            <Text className="text-[10px] font-bold tracking-widest uppercase text-stone-400">
              {categoryLabel}
            </Text>

            {/* Rating Badge */}
            {recipe.average_rating && recipe.average_rating > 0 && (
              <View className="flex-row items-center gap-0.5">
                <Text className="text-yellow-500 text-[10px]">★</Text>
                <Text className="text-[10px] font-medium text-stone-500">
                  {recipe.average_rating.toFixed(1)}
                </Text>
              </View>
            )}
          </View>

          {/* Title */}
          <Text
            className="font-playfair-bold text-[17px] leading-tight text-stone-800 mb-2"
            numberOfLines={2}
          >
            {recipe.title}
          </Text>

          {/* Meta Row */}
          <View className="flex-row items-center gap-3">
            {/* Time */}
            {totalTime > 0 && (
              <View className="flex-row items-center gap-1">
                <Clock size={12} color="#a8a29e" weight="regular" />
                <Text className="text-[11px] font-medium tracking-wide text-stone-500">
                  {formatDuration(totalTime, { t })}
                </Text>
              </View>
            )}

            {totalTime > 0 && getDifficultyLabel(recipe.difficulty) && (
              <View className="w-px h-2 bg-stone-300" />
            )}

            {/* Difficulty */}
            {getDifficultyLabel(recipe.difficulty) && (
              <View className="flex-row items-center gap-1">
                <View
                  className={`w-1.5 h-1.5 rounded-full ${getDifficultyDotColor(recipe.difficulty)}`}
                />
                <Text className="text-[11px] font-medium tracking-wide text-stone-500">
                  {getDifficultyLabel(recipe.difficulty)}
                </Text>
              </View>
            )}
          </View>
        </View>
      </Pressable>
    </View>
  );
});

/**
 * Skeleton for RecipeCard in horizontal sections
 */
export function RecipeCardSkeleton({
  width = 280,
  imageHeight = 160,
}: {
  width?: number;
  imageHeight?: number;
}) {
  return (
    <View style={{ width }} className="mb-6">
      {/* Image skeleton */}
      <Skeleton width={width} height={imageHeight} borderRadius={16} style={{ marginBottom: 12 }} />
      {/* Category and rating row */}
      <View className="flex-row items-center justify-between mb-1 px-1">
        <Skeleton width={60} height={10} borderRadius={4} />
        <Skeleton width={30} height={10} borderRadius={4} />
      </View>
      {/* Title */}
      <View className="px-1">
        <Skeleton width="100%" height={17} borderRadius={4} style={{ marginBottom: 4 }} />
        <Skeleton width="70%" height={17} borderRadius={4} style={{ marginBottom: 8 }} />
      </View>
      {/* Meta row */}
      <View className="flex-row items-center gap-3 px-1">
        <Skeleton width={50} height={12} borderRadius={4} />
        <Skeleton width={50} height={12} borderRadius={4} />
      </View>
    </View>
  );
}
