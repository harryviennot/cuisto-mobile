/**
 * Cooking History List Item
 *
 * Full-width row component for displaying a cooking event in list view.
 * Shows thumbnail, recipe title, date, rating, duration, and times cooked.
 * Supports swipe actions for edit and delete (both on right side).
 */
import React, { useState, useRef, useImperativeHandle, forwardRef } from "react";
import { View, Text, Pressable } from "react-native";
import { Image } from "expo-image";
import { router } from "expo-router";
import { Image as ImageIcon, Timer, Trash, PencilSimple } from "phosphor-react-native";
import ReanimatedSwipeable, { SwipeableMethods } from "react-native-gesture-handler/ReanimatedSwipeable";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  runOnJS,
} from "react-native-reanimated";
import type { CookingHistoryEvent } from "@/types/cookingHistory";
import { Skeleton } from "@/components/ui/Skeleton";
import { formatDuration } from "./utils";
import { StarRating } from "@/components/StarRating";

/** Ref type for tracking the currently open swipeable */
export type OpenSwipeableRef = React.RefObject<SwipeableMethods | null>;

/** Methods exposed by CookingHistoryListItem via ref */
export interface CookingHistoryListItemHandle {
  /** Animate the item collapsing out, then call the callback */
  animateDelete: (onComplete: () => void) => void;
}

export interface CookingHistoryListItemProps {
  /** The cooking history event to display */
  event: CookingHistoryEvent;
  /** Callback when edit action is triggered */
  onEdit?: (event: CookingHistoryEvent) => void;
  /** Callback when delete action is triggered - shows confirmation first */
  onDelete?: (event: CookingHistoryEvent) => void;
  /** Shared ref to track currently open swipeable - close others when opening */
  openSwipeableRef?: OpenSwipeableRef;
}

const ACTION_WIDTH = 72;

// Combined right actions component (Edit + Delete)
function RightActions({
  onEdit,
  onDelete,
}: {
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <View className="flex-row">
      {/* Edit Action - left of delete */}
      <Pressable onPress={onEdit}>
        <View
          className="bg-primary justify-center items-center"
          style={{ width: ACTION_WIDTH, height: "100%" }}
        >
          <PencilSimple size={22} color="white" weight="bold" />
          <Text className="text-white text-xs mt-1 font-medium">Edit</Text>
        </View>
      </Pressable>

      {/* Delete Action - closest to edge */}
      <Pressable onPress={onDelete}>
        <View
          className="bg-red-500 justify-center items-center"
          style={{ width: ACTION_WIDTH, height: "100%" }}
        >
          <Trash size={22} color="white" weight="bold" />
          <Text className="text-white text-xs mt-1 font-medium">Delete</Text>
        </View>
      </Pressable>
    </View>
  );
}

export const CookingHistoryListItem = forwardRef<CookingHistoryListItemHandle, CookingHistoryListItemProps>(
  function CookingHistoryListItem({ event, onEdit, onDelete, openSwipeableRef }, ref) {
  const [imageLoading, setImageLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const swipeableRef = useRef<SwipeableMethods>(null);

  // Animation values for collapse effect (used when item is deleted)
  const height = useSharedValue(100);
  const opacity = useSharedValue(1);

  // Animated styles for the container
  const animatedStyle = useAnimatedStyle(() => {
    return {
      height: height.value,
      opacity: opacity.value,
      overflow: "hidden" as const,
    };
  });

  // Expose animateDelete method via ref
  useImperativeHandle(ref, () => ({
    animateDelete: (onComplete: () => void) => {
      setIsDeleting(true);
      // Run collapse animation
      height.value = withTiming(0, { duration: 250 }, (finished) => {
        if (finished) {
          runOnJS(onComplete)();
        }
      });
      opacity.value = withTiming(0, { duration: 200 });
    },
  }));

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
    swipeableRef.current?.close();
    onDelete?.(event);
  };

  // Close previously open swipeable immediately when drag starts on this one
  const handleBeginDrag = () => {
    if (openSwipeableRef?.current && openSwipeableRef.current !== swipeableRef.current) {
      openSwipeableRef.current.close();
    }
  };

  // Track this as the currently open swipeable
  const handleSwipeableOpen = () => {
    if (openSwipeableRef) {
      (openSwipeableRef as React.MutableRefObject<SwipeableMethods | null>).current = swipeableRef.current;
    }
  };

  // Clear tracking when closed
  const handleSwipeableClose = () => {
    if (openSwipeableRef?.current === swipeableRef.current) {
      (openSwipeableRef as React.MutableRefObject<SwipeableMethods | null>).current = null;
    }
  };

  // Render function for swipeable actions (edit + delete on right)
  const renderRightActions = () => (
    <RightActions onEdit={handleEdit} onDelete={handleDelete} />
  );

  return (
    <Animated.View style={animatedStyle}>
      <ReanimatedSwipeable
        ref={swipeableRef}
        friction={1.5}
        enableTrackpadTwoFingerGesture
        rightThreshold={ACTION_WIDTH}
        overshootRight={false}
        renderRightActions={renderRightActions}
        onSwipeableOpenStartDrag={handleBeginDrag}
        onSwipeableOpen={handleSwipeableOpen}
        onSwipeableClose={handleSwipeableClose}
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
});

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
