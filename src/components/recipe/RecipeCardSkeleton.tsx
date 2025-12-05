/**
 * RecipeCardSkeleton Component
 *
 * Shimmer loading skeleton matching RecipeCard dimensions.
 * Used while recipes are being fetched.
 */
import React from "react";
import { View } from "react-native";
import { Skeleton } from "../ui/Skeleton";

interface RecipeCardSkeletonProps {
  height?: number;
}

export function RecipeCardSkeleton({ height = 220 }: RecipeCardSkeletonProps) {
  return (
    <View className="mb-6">
      {/* Image placeholder */}
      <View
        className="w-full overflow-hidden rounded-2xl"
        style={{
          height,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.08,
          shadowRadius: 4,
          elevation: 2,
        }}
      >
        <Skeleton width="100%" height="100%" borderRadius={16} />
      </View>

      {/* Content area */}
      <View className="mt-3 px-1">
        {/* Category row */}
        <View className="flex-row items-center justify-between mb-2">
          <Skeleton width={60} height={10} borderRadius={4} />
          <Skeleton width={8} height={8} borderRadius={4} />
        </View>

        {/* Title */}
        <View className="mb-2">
          <Skeleton width="90%" height={18} borderRadius={4} style={{ marginBottom: 4 }} />
          <Skeleton width="60%" height={18} borderRadius={4} />
        </View>

        {/* Meta row */}
        <View className="flex-row items-center gap-3">
          <Skeleton width={50} height={12} borderRadius={4} />
          <Skeleton width={50} height={12} borderRadius={4} />
        </View>
      </View>
    </View>
  );
}
