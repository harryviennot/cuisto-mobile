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
import { Star, Image as ImageIcon, Timer, Trash } from "phosphor-react-native";
import ReanimatedSwipeable from "react-native-gesture-handler/ReanimatedSwipeable";
import Animated, { useSharedValue, useAnimatedStyle, withTiming, SharedValue } from "react-native-reanimated";
import { useTranslation } from "react-i18next";
import type { CookingHistoryEvent } from "@/types/cookingHistory";
import { Skeleton } from "@/components/ui/Skeleton";
import { formatRelativeDate, formatDuration } from "./utils";

export interface CookingHistoryListItemProps {
  /** The cooking history event to display */
  event: CookingHistoryEvent;
}

const THUMBNAIL_SIZE = 80;

// ... imports remain the same

export function CookingHistoryListItem({ event }: CookingHistoryListItemProps) {
  const { t } = useTranslation();
  const [imageLoading, setImageLoading] = useState(true);
  const [isDeleted, setIsDeleted] = useState(false);

  // Animation values for collapse effect
  const height = useSharedValue(88); // Approximate height of the item
  const opacity = useSharedValue(1);
  const marginVertical = useSharedValue(0);

  // Animated styles for the container
  const animatedStyle = useAnimatedStyle(() => {
    return {
      height: height.value,
      opacity: opacity.value,
      marginVertical: marginVertical.value,
    };
  });

  // Use cooking photo if available, otherwise recipe image
  const imageUrl = event.cooking_image_url || event.recipe_image_url;
  // Get Day Number
  const dateObj = new Date(event.cooked_at);
  const dayNumber = dateObj.getDate();

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

  const handleDelete = () => {
    // Animate collapse
    height.value = withTiming(0, { duration: 300 });
    opacity.value = withTiming(0, { duration: 300 });
    marginVertical.value = withTiming(0, { duration: 300 });
    setIsDeleted(true);
  };

  const renderRightActions = (
    progress: SharedValue<number>,
    dragX: SharedValue<number>
  ) => {
    const trans = useAnimatedStyle(() => {
      return {
        transform: [{ translateX: dragX.value + 80 }],
      };
    });

    return (
      <View
        className="bg-red-500 justify-center items-end"
        style={{ width: 80, height: "100%" }}
      >
        <Animated.View
          style={[trans, { width: 80, height: "100%", justifyContent: "center", alignItems: "center" }]}
        >
          <Trash size={24} color="white" weight="bold" />
        </Animated.View>
      </View>
    );
  };

  if (isDeleted && height.value === 0) {
    return null;
  }

  return (
    <Animated.View
      style={[
        animatedStyle,
        { overflow: isDeleted ? "hidden" : "visible" }
      ]}
    >
      <ReanimatedSwipeable
        friction={1}
        enableTrackpadTwoFingerGesture
        rightThreshold={40}
        containerStyle={{ overflow: "visible" }}
        childrenContainerStyle={{ overflow: "visible" }}
        renderRightActions={renderRightActions}
        onSwipeableOpen={(direction) => {
          if (direction === "right") {
            handleDelete();
          }
        }}
      >
        <Pressable
          onPress={handlePress}
          className="flex-row items-center py-3 px-4 active:bg-stone-100 border-b border-border-light bg-surface"
        >
          {/* Day Number */}
          <View className="w-12 items-center justify-center mr-2">
            <Text className="text-2xl font-light text-foreground-tertiary">
              {dayNumber}
            </Text>
          </View>

          {/* Poster Image (2:3 aspect ratio) */}
          <View
            className="rounded-md overflow-hidden bg-stone-200 border border-border-light"
            style={{
              width: 50,
              height: 75, // 2:3 aspect ratio
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.1,
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
                  onLoadStart={() => setImageLoading(true)}
                  onLoad={() => setImageLoading(false)}
                  onError={() => setImageLoading(false)}
                />
              </>
            ) : (
              <View className="w-full h-full items-center justify-center">
                <ImageIcon size={20} color="#a8a29e" weight="duotone" />
              </View>
            )}
          </View>

          {/* Content */}
          <View className="flex-1 ml-4 justify-center">
            {/* Title */}
            <Text
              className="text-base font-bold text-foreground-heading leading-tight"
              numberOfLines={1}
            >
              {event.recipe_title}
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

            {/* Year (Optional, if needed, but header has it) */}
            {/* <Text className="text-xs text-foreground-tertiary mt-1">
               {dateObj.getFullYear()}
             </Text> */}
          </View>
        </Pressable>
      </ReanimatedSwipeable>
    </Animated.View>
  );
}

/**
 * Skeleton loader for CookingHistoryListItem
 */
export function CookingHistoryListItemSkeleton() {
  return (
    <View className="flex-row items-center py-3 px-4 border-b border-border-light">
      {/* Date Placeholder */}
      <View className="w-12 items-center justify-center mr-2">
        <Skeleton width={20} height={24} borderRadius={4} />
      </View>

      {/* Poster Placeholder */}
      <Skeleton width={50} height={75} borderRadius={6} />

      {/* Content Placeholder */}
      <View className="flex-1 ml-4">
        <Skeleton width="70%" height={16} borderRadius={4} />
        <View className="flex-row gap-3 mt-2">
          <Skeleton width={40} height={14} borderRadius={4} />
          <Skeleton width={50} height={14} borderRadius={4} />
        </View>
      </View>
    </View>
  );
}
