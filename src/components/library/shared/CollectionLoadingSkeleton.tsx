/**
 * Collection Loading Skeleton
 *
 * Grid of recipe card skeletons for loading states.
 * Used when collection data is being fetched.
 */
import React, { useMemo } from "react";
import { View } from "react-native";
import { RecipeCardSkeleton } from "@/components/recipe";

export interface CollectionLoadingSkeletonProps {
  /** Top padding (usually safe area + header height) */
  topPadding?: number;
  /** Number of skeleton cards to show (default: 4) */
  count?: number;
}

export function CollectionLoadingSkeleton({
  topPadding = 0,
  count = 4,
}: CollectionLoadingSkeletonProps) {
  const skeletons = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => (
        <View key={i} style={{ width: "48%" }}>
          <RecipeCardSkeleton height={i % 2 === 0 ? 200 : 240} />
        </View>
      )),
    [count]
  );

  return (
    <View className="flex-row flex-wrap justify-between px-4" style={{ paddingTop: topPadding }}>
      {skeletons}
    </View>
  );
}
