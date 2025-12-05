/**
 * CollectionCardSkeleton Component
 *
 * Shimmer loading skeleton matching SmartCollectionCard dimensions.
 * Used while collections are being fetched.
 */
import React, { useEffect } from "react";
import { View } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  interpolate,
} from "react-native-reanimated";

export function CollectionCardSkeleton() {
  const shimmerProgress = useSharedValue(0);

  useEffect(() => {
    shimmerProgress.value = withRepeat(
      withTiming(1, { duration: 1200 }),
      -1,
      false
    );
  }, [shimmerProgress]);

  const shimmerStyle = useAnimatedStyle(() => ({
    opacity: interpolate(shimmerProgress.value, [0, 0.5, 1], [0.3, 0.7, 0.3]),
  }));

  return (
    <View
      className="bg-surface-elevated rounded-[20px] p-5 border border-border-light"
      style={{
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 4,
        elevation: 2,
      }}
    >
      {/* Header row: Icon and Count placeholders */}
      <View className="flex-row justify-between items-start mb-4">
        {/* Icon placeholder */}
        <Animated.View
          style={shimmerStyle}
          className="w-12 h-12 rounded-full bg-stone-200"
        />

        {/* Count placeholder */}
        <Animated.View
          style={shimmerStyle}
          className="w-8 h-8 rounded bg-stone-200"
        />
      </View>

      {/* Title and Subtitle placeholders */}
      <View>
        <Animated.View
          style={shimmerStyle}
          className="h-5 w-24 rounded bg-stone-200 mb-2"
        />
        <Animated.View
          style={shimmerStyle}
          className="h-3 w-16 rounded bg-stone-200"
        />
      </View>
    </View>
  );
}
