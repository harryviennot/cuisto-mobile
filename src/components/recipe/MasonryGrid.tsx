import { View, ScrollView, RefreshControl, ActivityIndicator, Text } from "react-native";
import { useMemo, useCallback, type ReactElement } from "react";
import { RecipeCard } from "./RecipeCard";
import type { Recipe } from "@/types/recipe";

export interface MasonryGridProps {
  recipes: Recipe[];
  loading?: boolean;
  refreshing?: boolean;
  onRefresh?: () => void;
  onEndReached?: () => void;
  onEndReachedThreshold?: number;
  showLoadingFooter?: boolean;
  onScroll?: (event: any) => void;
  ListEmptyComponent?: ReactElement;
  ListHeaderComponent?: ReactElement;
}

export function MasonryGrid({
  recipes,
  loading = false,
  refreshing = false,
  onRefresh,
  onEndReached,
  onEndReachedThreshold = 100,
  showLoadingFooter = false,
  onScroll,
  ListEmptyComponent,
  ListHeaderComponent,
}: MasonryGridProps) {
  // Distribute recipes into two columns for masonry layout
  const columns = useMemo(() => {
    const leftColumn: Recipe[] = [];
    const rightColumn: Recipe[] = [];
    const columnHeights = [0, 0];

    recipes.forEach((recipe) => {
      // Generate consistent but varied heights based on recipe ID
      const hash = recipe.id.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
      const heightVariations = [180, 200, 220, 240, 260, 280];
      const baseHeight = heightVariations[hash % heightVariations.length];
      const offset = (hash * 17) % 40;
      const imageHeight = baseHeight + offset;
      // Approximate total card height (image + metadata section)
      const approxCardHeight = imageHeight + 120;

      // Add to shorter column to balance layout
      if (columnHeights[0] <= columnHeights[1]) {
        leftColumn.push(recipe);
        columnHeights[0] += approxCardHeight;
      } else {
        rightColumn.push(recipe);
        columnHeights[1] += approxCardHeight;
      }
    });

    return { leftColumn, rightColumn };
  }, [recipes]);

  // Handle scroll for infinite loading and custom scroll handler
  const handleScroll = useCallback(
    (event: any) => {
      // Call custom onScroll handler if provided
      if (onScroll) {
        onScroll(event);
      }

      // Handle infinite loading
      if (!onEndReached) return;

      const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
      const isCloseToBottom =
        layoutMeasurement.height + contentOffset.y >= contentSize.height - onEndReachedThreshold;

      if (isCloseToBottom) {
        onEndReached();
      }
    },
    [onScroll, onEndReached, onEndReachedThreshold]
  );

  // Show loading state
  if (loading && recipes.length === 0) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" color="#334d43" />
      </View>
    );
  }

  // Show empty state
  if (recipes.length === 0 && ListEmptyComponent) {
    return <View className="flex-1">{ListEmptyComponent}</View>;
  }

  return (
    <ScrollView
      className="flex-1"
      showsVerticalScrollIndicator={false}
      onScroll={handleScroll}
      scrollEventThrottle={16}
      refreshControl={
        onRefresh ? (
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#334d43"
            colors={["#334d43"]}
          />
        ) : undefined
      }
    >
      {ListHeaderComponent}

      <View className="flex-row p-4 gap-2">
        {/* Left Column */}
        <View className="flex-1 gap-2">
          {columns.leftColumn.map((recipe, index) => (
            <RecipeCard key={recipe.id} recipe={recipe} index={index * 2} />
          ))}
        </View>

        {/* Right Column */}
        <View className="flex-1 gap-2">
          {columns.rightColumn.map((recipe, index) => (
            <RecipeCard key={recipe.id} recipe={recipe} index={index * 2 + 1} />
          ))}
        </View>
      </View>

      {/* Loading indicator for pagination */}
      {showLoadingFooter && (
        <View className="py-4 items-center">
          <ActivityIndicator size="small" color="#334d43" />
        </View>
      )}
    </ScrollView>
  );
}
