/**
 * Cooking History List Item
 *
 * Full-width row component for displaying a cooking event in list view.
 * Shows thumbnail, recipe title, date, rating, duration, and times cooked.
 * Supports swipe actions for edit (left) and delete (right).
 */
import React, { useState, useRef } from "react";
import { View, Text, Pressable } from "react-native";
import { Image } from "expo-image";
import { router } from "expo-router";
import { Image as ImageIcon, Timer, Trash, PencilSimple } from "phosphor-react-native";
import ReanimatedSwipeable, { SwipeableMethods } from "react-native-gesture-handler/ReanimatedSwipeable";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  interpolate,
  SharedValue,
} from "react-native-reanimated";
import type { CookingHistoryEvent } from "@/types/cookingHistory";
import { Skeleton } from "@/components/ui/Skeleton";
import { formatDuration } from "./utils";
import { StarRating } from "@/components/StarRating";

export interface CookingHistoryListItemProps {
  /** The cooking history event to display */
  event: CookingHistoryEvent;
  /** Callback when edit action is triggered */
  onEdit?: (event: CookingHistoryEvent) => void;
  /** Callback when delete action is triggered */
  onDelete?: (event: CookingHistoryEvent) => void;
}

const ACTION_WIDTH = 72;

// Swipe action component for edit (left)
function LeftAction({
  progress,
  onPress,
}: {
  progress: SharedValue<number>;
  onPress: () => void;
}) {
  const actionStyle = useAnimatedStyle(() => {
    const scale = interpolate(progress.value, [0, 1], [0.8, 1]);
    const opacityValue = interpolate(progress.value, [0, 0.5, 1], [0, 0.5, 1]);
    return {
      transform: [{ scale }],
      opacity: opacityValue,
    };
  });

  return (
    <Pressable onPress={onPress}>
      <View
        className="bg-primary justify-center items-center"
        style={{ width: ACTION_WIDTH, height: "100%" }}
      >
        <Animated.View style={actionStyle}>
          <PencilSimple size={24} color="white" weight="bold" />
        </Animated.View>
      </View>
    </Pressable>
  );
}

// Swipe action component for delete (right)
function RightAction({
  progress,
  onPress,
}: {
  progress: SharedValue<number>;
  onPress: () => void;
}) {
  const actionStyle = useAnimatedStyle(() => {
    const scale = interpolate(progress.value, [0, 1], [0.8, 1]);
    const opacityValue = interpolate(progress.value, [0, 0.5, 1], [0, 0.5, 1]);
    return {
      transform: [{ scale }],
      opacity: opacityValue,
    };
  });

  return (
    <Pressable onPress={onPress}>
      <View
        className="bg-red-500 justify-center items-center"
        style={{ width: ACTION_WIDTH, height: "100%" }}
      >
        <Animated.View style={actionStyle}>
          <Trash size={24} color="white" weight="bold" />
        </Animated.View>
      </View>
    </Pressable>
  );
}

export function CookingHistoryListItem({ event, onEdit, onDelete }: CookingHistoryListItemProps) {
  const [imageLoading, setImageLoading] = useState(true);
  const [isDeleted, setIsDeleted] = useState(false);
  const swipeableRef = useRef<SwipeableMethods>(null);

  // Animation values for collapse effect
  const height = useSharedValue(100);
  const opacity = useSharedValue(1);

  // Animated styles for the container
  const animatedStyle = useAnimatedStyle(() => {
    return {
      height: height.value,
      opacity: opacity.value,
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

  const handleEdit = () => {
    swipeableRef.current?.close();
    onEdit?.(event);
  };

  const handleDelete = () => {
    // Animate collapse
    height.value = withTiming(0, { duration: 300 });
    opacity.value = withTiming(0, { duration: 300 });
    setIsDeleted(true);
    onDelete?.(event);
  };

  // Render functions for swipeable actions
  const renderLeftActions = (progress: SharedValue<number>) => (
    <LeftAction progress={progress} onPress={handleEdit} />
  );

  const renderRightActions = (progress: SharedValue<number>) => (
    <RightAction progress={progress} onPress={handleDelete} />
  );

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
        ref={swipeableRef}
        friction={2}
        enableTrackpadTwoFingerGesture
        leftThreshold={ACTION_WIDTH}
        rightThreshold={ACTION_WIDTH}
        overshootLeft={false}
        overshootRight={false}
        renderLeftActions={renderLeftActions}
        renderRightActions={renderRightActions}
        onSwipeableOpen={(direction) => {
          if (direction === "right") {
            handleDelete();
          }
        }}
      >
        <Pressable
          onPress={handlePress}
          className="flex-row items-center py-3 pl-3 pr-4 active:bg-stone-100 border-b border-border-light bg-surface"
        >
          {/* Day Number */}
          <View className="w-12 items-center justify-center mr-2">
            <Text className="text-[48px] font-light font-playfair text-primary leading-none">
              {dayNumber}
            </Text>
          </View>

          {/* Poster Image (2:3 aspect ratio) */}
          <View
            className="rounded-md overflow-hidden bg-stone-200 border border-border-light"
            style={{
              width: 75,
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
          <View className="flex-1 h-full ml-4 justify-between">
            {/* Title */}
            <Text
              className="text-base font-bold text-foreground-heading leading-tight"
              numberOfLines={2}
            >
              {event.recipe_title}
            </Text>
            {event.rating && (
              <StarRating
                rating={event.rating}
                size={16}
                editable={false}
              />
            )}

            {/* Meta Row: Rating, Duration, Times Cooked */}
            <View className="flex-row items-center gap-3 mt-1.5">


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
              {/* {event.times_cooked > 1 && (
                <View className="bg-primary/10 rounded-full px-2 py-0.5">
                  <Text className="text-[10px] text-primary font-semibold">
                    {t("cookingHistory.cookedTimes", { count: event.times_cooked })}
                  </Text>
                </View>
              )} */}
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
