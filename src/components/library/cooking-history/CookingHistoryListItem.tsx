/**
 * Cooking History List Item
 *
 * Full-width row component for displaying a cooking event in list view.
 * Shows thumbnail, recipe title, date, rating, duration, and times cooked.
 */
import React, { useState } from "react";
import { View, Text, Pressable } from "react-native";
import { Image } from "expo-image";
import { router } from "expo-router";
import { Star, Image as ImageIcon, Timer } from "phosphor-react-native";
import { useTranslation } from "react-i18next";
import type { CookingHistoryEvent } from "@/types/cookingHistory";
import { Skeleton } from "@/components/ui/Skeleton";
import { formatRelativeDate, formatDuration } from "./utils";

export interface CookingHistoryListItemProps {
  /** The cooking history event to display */
  event: CookingHistoryEvent;
}

const THUMBNAIL_SIZE = 80;

export function CookingHistoryListItem({ event }: CookingHistoryListItemProps) {
  const { t } = useTranslation();
  const [imageLoading, setImageLoading] = useState(true);

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
      className="flex-row items-center py-3 px-4 active:bg-stone-100 border-b border-border-light"
    >
      {/* Thumbnail */}
      <View
        className="rounded-xl overflow-hidden bg-stone-200"
        style={{
          width: THUMBNAIL_SIZE,
          height: THUMBNAIL_SIZE,
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
              onLoad={() => setImageLoading(false)}
              onError={() => setImageLoading(false)}
            />
          </>
        ) : (
          <View className="w-full h-full items-center justify-center">
            <ImageIcon size={28} color="#a8a29e" weight="duotone" />
          </View>
        )}
      </View>

      {/* Content */}
      <View className="flex-1 ml-3">
        {/* Title */}
        <Text
          className="text-base font-semibold text-foreground-heading leading-tight"
          numberOfLines={2}
        >
          {event.recipe_title}
        </Text>

        {/* Date */}
        <Text className="text-xs text-foreground-tertiary mt-1">
          {relativeDate}
        </Text>

        {/* Meta Row: Rating, Duration, Times Cooked */}
        <View className="flex-row items-center gap-3 mt-1.5">
          {/* Rating */}
          {event.rating && (
            <View className="flex-row items-center">
              <Star size={12} color="#fbbf24" weight="fill" />
              <Text className="text-xs text-foreground-secondary ml-0.5 font-medium">
                {event.rating.toFixed(1)}
              </Text>
            </View>
          )}

          {/* Duration */}
          {event.duration_minutes && (
            <View className="flex-row items-center">
              <Timer size={12} color="#78716c" weight="regular" />
              <Text className="text-xs text-foreground-tertiary ml-0.5">
                {formatDuration(event.duration_minutes)}
              </Text>
            </View>
          )}

          {/* Times Cooked (if > 1) */}
          {event.times_cooked > 1 && (
            <View className="bg-primary/10 rounded-full px-2 py-0.5">
              <Text className="text-[10px] text-primary font-semibold">
                {t("cookingHistory.cookedTimes", { count: event.times_cooked })}
              </Text>
            </View>
          )}
        </View>
      </View>
    </Pressable>
  );
}

/**
 * Skeleton loader for CookingHistoryListItem
 */
export function CookingHistoryListItemSkeleton() {
  return (
    <View className="flex-row items-center py-3 px-4 border-b border-border-light">
      <Skeleton width={THUMBNAIL_SIZE} height={THUMBNAIL_SIZE} borderRadius={12} />
      <View className="flex-1 ml-3">
        <Skeleton width="80%" height={18} borderRadius={4} />
        <View className="mt-1.5">
          <Skeleton width="40%" height={12} borderRadius={3} />
        </View>
        <View className="flex-row gap-3 mt-2">
          <Skeleton width={40} height={14} borderRadius={4} />
          <Skeleton width={50} height={14} borderRadius={4} />
        </View>
      </View>
    </View>
  );
}
