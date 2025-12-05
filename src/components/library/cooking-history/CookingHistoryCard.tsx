/**
 * Cooking History Card
 *
 * Compact card component for displaying a cooking event in the horizontal scroll preview.
 * Shows the recipe image (cooking photo if available, otherwise recipe image),
 * title, rating, and when it was cooked.
 */
import React, { useState } from "react";
import { View, Text, Pressable } from "react-native";
import { Image } from "expo-image";
import { router } from "expo-router";
import { Star, Image as ImageIcon } from "phosphor-react-native";
import type { CookingHistoryEvent } from "@/types/cookingHistory";
import { Skeleton } from "@/components/ui/Skeleton";
import { formatRelativeDate } from "./utils";

export interface CookingHistoryCardProps {
  /** The cooking history event to display */
  event: CookingHistoryEvent;
  /** Card width (default: 110) */
  width?: number;
}

export function CookingHistoryCard({ event, width = 110 }: CookingHistoryCardProps) {
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState<string | null>(null);

  // Use cooking photo if available, otherwise recipe image
  const imageUrl = event.cooking_image_url || event.recipe_image_url;
  const relativeDate = formatRelativeDate(event.cooked_at);

  const handlePress = () => {
    router.push({
      pathname: `/recipe/[id]` as const,
      params: {
        id: event.recipe_id,
        title: event.recipe_title,
        ...(event.recipe_image_url && { imageUrl: event.recipe_image_url }),
      },
    });
  };

  return (
    <Pressable
      onPress={handlePress}
      className="active:opacity-90"
      style={{ width }}
    >
      {/* Square Image */}
      <View
        className="rounded-xl overflow-hidden bg-stone-200"
        style={{
          width,
          height: width,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.08,
          shadowRadius: 2,
          elevation: 1,
        }}
      >
        {imageUrl ? (
          <>
            {imageLoading && (
              <View className="absolute inset-0 z-10">
                <Skeleton width="100%" height="100%" borderRadius={0} />
              </View>
            )}
            <Image
              source={{ uri: imageUrl }}
              style={{ width: "100%", height: "100%" }}
              contentFit="cover"
              transition={200}
              cachePolicy="memory-disk"
              onLoadStart={() => setImageLoading(true)}
              onLoad={() => {
                setImageLoading(false);
                setImageError(null);
              }}
              onError={() => {
                setImageLoading(false);
                setImageError("Failed to load");
              }}
            />
          </>
        ) : (
          <View className="w-full h-full items-center justify-center">
            <ImageIcon size={28} color="#a8a29e" weight="duotone" />
          </View>
        )}

        {/* Rating Badge (if rated) */}
        {event.rating && (
          <View className="absolute bottom-1.5 left-1.5 flex-row items-center bg-black/50 rounded-full px-1.5 py-0.5">
            <Star size={10} color="#fbbf24" weight="fill" />
            <Text className="text-white text-[10px] font-semibold ml-0.5">
              {event.rating.toFixed(1)}
            </Text>
          </View>
        )}
      </View>

      {/* Title & Date */}
      <View className="mt-2 px-0.5">
        <Text
          className="text-xs font-semibold text-foreground-heading leading-tight"
          numberOfLines={2}
        >
          {event.recipe_title}
        </Text>
        <Text className="text-[10px] text-foreground-tertiary mt-0.5">
          {relativeDate}
        </Text>
      </View>
    </Pressable>
  );
}

/**
 * Skeleton loader for CookingHistoryCard
 */
export function CookingHistoryCardSkeleton({ width = 110 }: { width?: number }) {
  return (
    <View style={{ width }}>
      <Skeleton width={width} height={width} borderRadius={12} />
      <View className="mt-2 px-0.5">
        <Skeleton width={width - 10} height={14} borderRadius={4} />
        <View className="mt-1">
          <Skeleton width={width * 0.6} height={10} borderRadius={3} />
        </View>
      </View>
    </View>
  );
}
