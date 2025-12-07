/**
 * DiscoveryRecipeCard
 *
 * Compact recipe card for horizontal discovery sections.
 * Similar style to CookingHistoryCard but for recipes.
 */
import React, { memo, useState } from "react";
import { View, Text, Pressable } from "react-native";
import { Image } from "expo-image";
import { router } from "expo-router";
import { Image as ImageIcon, Clock, Fire, Users } from "phosphor-react-native";
import type { Recipe } from "@/types/recipe";
import type { TrendingRecipe, ExtractedRecipe } from "@/types/discovery";
import { Skeleton } from "@/components/ui/Skeleton";

interface DiscoveryRecipeCardProps {
  recipe: Recipe | TrendingRecipe | ExtractedRecipe;
  width?: number;
}

export const DiscoveryRecipeCard = memo(function DiscoveryRecipeCard({
  recipe,
  width = 140,
}: DiscoveryRecipeCardProps) {
  const [imageLoading, setImageLoading] = useState(true);

  const handlePress = () => {
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

  // Get stats badge info
  const getStatsBadge = () => {
    if ("cooking_stats" in recipe && recipe.cooking_stats) {
      return {
        icon: <Fire size={12} weight="fill" color="#f97316" />,
        text: `${recipe.cooking_stats.cook_count} cooked`,
      };
    }
    if ("extraction_stats" in recipe && recipe.extraction_stats) {
      return {
        icon: <Users size={12} weight="fill" color="#6366f1" />,
        text: `${recipe.extraction_stats.extraction_count} extracted`,
      };
    }
    return null;
  };

  const statsBadge = getStatsBadge();
  const imageHeight = width * 1.1; // Slightly taller aspect ratio

  return (
    <Pressable
      onPress={handlePress}
      className="overflow-hidden"
      style={{ width }}
    >
      {/* Image */}
      <View
        className="rounded-xl overflow-hidden bg-surface-secondary mb-2"
        style={{ height: imageHeight }}
      >
        {recipe.image_url ? (
          <>
            <Image
              source={{ uri: recipe.image_url }}
              style={{ width: "100%", height: "100%" }}
              contentFit="cover"
              transition={200}
              onLoadStart={() => setImageLoading(true)}
              onLoadEnd={() => setImageLoading(false)}
            />
            {imageLoading && (
              <View className="absolute inset-0">
                <Skeleton width="100%" height="100%" borderRadius={0} />
              </View>
            )}
          </>
        ) : (
          <View className="w-full h-full items-center justify-center bg-surface-secondary">
            <ImageIcon size={32} color="#9ca3af" weight="light" />
          </View>
        )}

        {/* Stats badge overlay */}
        {statsBadge && (
          <View className="absolute bottom-2 left-2 right-2">
            <View className="flex-row items-center bg-black/60 px-2 py-1 rounded-full self-start">
              {statsBadge.icon}
              <Text className="text-white text-xs ml-1 font-medium">
                {statsBadge.text}
              </Text>
            </View>
          </View>
        )}
      </View>

      {/* Title */}
      <Text
        className="text-foreground-heading font-semibold text-sm leading-tight"
        numberOfLines={2}
      >
        {recipe.title}
      </Text>

      {/* Metadata row */}
      <View className="flex-row items-center mt-1">
        {totalTime > 0 && (
          <View className="flex-row items-center">
            <Clock size={12} color="#9ca3af" weight="regular" />
            <Text className="text-foreground-tertiary text-xs ml-1">
              {totalTime} min
            </Text>
          </View>
        )}
        {recipe.average_rating && recipe.average_rating > 0 && (
          <View className="flex-row items-center ml-2">
            <Text className="text-yellow-500 text-xs">★</Text>
            <Text className="text-foreground-tertiary text-xs ml-0.5">
              {recipe.average_rating.toFixed(1)}
            </Text>
          </View>
        )}
      </View>
    </Pressable>
  );
});

/**
 * Skeleton for DiscoveryRecipeCard
 */
export function DiscoveryRecipeCardSkeleton({ width = 140 }: { width?: number }) {
  const imageHeight = width * 1.1;

  return (
    <View style={{ width }}>
      <Skeleton
        width={width}
        height={imageHeight}
        borderRadius={12}
        style={{ marginBottom: 8 }}
      />
      <Skeleton width="100%" height={16} borderRadius={4} style={{ marginBottom: 4 }} />
      <Skeleton width="66%" height={16} borderRadius={4} style={{ marginBottom: 4 }} />
      <Skeleton width="50%" height={12} borderRadius={4} />
    </View>
  );
}
