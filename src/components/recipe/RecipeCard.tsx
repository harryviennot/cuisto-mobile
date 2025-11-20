/**
 * Recipe card component for displaying recipe in grid view
 * Editorial Pinterest-style design with glassmorphism
 */
import { memo } from "react";
import { View, Text, Pressable, Platform } from "react-native";
import { Image } from "expo-image";
import { router } from "expo-router";
import { Image as ImageIcon, Clock, Flame, Bookmark } from "phosphor-react-native";
import { BlurView } from "expo-blur";
import type { Recipe } from "@/types/recipe";

interface RecipeCardProps {
  recipe: Recipe;
  index: number;
}

export const RecipeCard = memo(function RecipeCard({ recipe }: RecipeCardProps) {
  const handlePress = () => {
    router.push(`/recipe/preview/${recipe.id}` as any);
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

  const imageHeight = getImageHeight();

  // Get category or first tag
  const categoryLabel = recipe.categories?.[0] || recipe.tags?.[0] || "RECIPE";

  // Get calories (placeholder - TODO: add nutrition field to Recipe type)
  const calories = 450;

  // Check if favorited (TODO: add user_recipe_data to Recipe type)
  const isFavorite = false;

  return (
    <View className="mb-6">
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
            <Image
              source={{ uri: recipe.image_url }}
              style={{ width: "100%", height: "100%" }}
              contentFit="cover"
              transition={200}
              cachePolicy="memory-disk"
              priority="normal"
            />
          ) : (
            <View className="w-full h-full items-center justify-center gap-2">
              <ImageIcon size={48} color="#a8a29e" weight="duotone" />
              <Text className="text-stone-400 text-sm">No Image</Text>
            </View>
          )}

          {/* Floating Bookmark Button with Glassmorphism */}
          <View className="absolute top-2 right-2">
            {Platform.OS === "ios" ? (
              <BlurView
                intensity={20}
                tint="light"
                className="h-8 w-8 rounded-full overflow-hidden border border-white/20"
              >
                <Pressable
                  className="h-full w-full items-center justify-center active:opacity-70"
                  onPress={(e) => {
                    e.stopPropagation();
                    // TODO: Implement bookmark toggle
                  }}
                >
                  <Bookmark size={14} color="#ffffff" weight={isFavorite ? "fill" : "regular"} />
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
                  // TODO: Implement bookmark toggle
                }}
              >
                <Bookmark size={14} color="#ffffff" weight={isFavorite ? "fill" : "regular"} />
              </Pressable>
            )}
          </View>
        </View>

        {/* Content Area - Minimalist & Editorial */}
        <View className="mt-3 px-1">
          {/* Category and Difficulty Row */}
          <View className="flex-row items-center justify-between mb-1">
            <Text className="text-[10px] font-bold tracking-widest uppercase text-stone-400">
              {categoryLabel}
            </Text>

            {/* Difficulty Dot */}
            {recipe.difficulty && (
              <View className="flex-row items-center gap-1">
                <View
                  className={`w-1.5 h-1.5 rounded-full ${getDifficultyDotColor(recipe.difficulty)}`}
                />
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
                  {totalTime} min
                </Text>
              </View>
            )}

            {totalTime > 0 && <View className="w-px h-2 bg-stone-300" />}

            {/* Calories */}
            <View className="flex-row items-center gap-1">
              <Flame size={12} color="#a8a29e" weight="regular" />
              <Text className="text-[11px] font-medium tracking-wide text-stone-500">
                {calories} kcal
              </Text>
            </View>
          </View>
        </View>
      </Pressable>
    </View>
  );
});
