/**
 * Masonry grid component for displaying recipes in Pinterest-style layout
 * True masonry: each column is independent, items stack without row constraints
 */
import { useCallback, useMemo } from "react";
import { View, ScrollView, RefreshControl, ActivityIndicator, Text, Pressable } from "react-native";
import { Plus, Warning } from "phosphor-react-native";
import { useQueryClient } from "@tanstack/react-query";
import { useRecipes } from "@/hooks/useRecipes";
import { RecipeCard } from "./RecipeCard";
import type { Recipe } from "@/types/recipe";

export function RecipeMasonryGrid() {
  const queryClient = useQueryClient();
  const {
    data,
    isLoading,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch,
    isRefetching,
  } = useRecipes();

  // Handle pull-to-refresh: reset to first page only
  const handleRefresh = useCallback(async () => {
    // Clear cached pages and refetch only first page
    queryClient.setQueryData(["recipes"], (oldData: any) => {
      if (!oldData) return oldData;
      // Keep only the first page
      return {
        pages: oldData.pages.slice(0, 1),
        pageParams: oldData.pageParams.slice(0, 1),
      };
    });
    await refetch();
  }, [refetch, queryClient]);

  const handleRetry = useCallback(async () => {
    // On error retry, reset to first page only
    queryClient.setQueryData(["recipes"], (oldData: any) => {
      if (!oldData) return oldData;
      return {
        pages: oldData.pages.slice(0, 1),
        pageParams: oldData.pageParams.slice(0, 1),
      };
    });
    await refetch();
  }, [refetch, queryClient]);

  // Handle scroll to bottom for infinite loading
  const handleScroll = useCallback(
    (event: any) => {
      const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
      const paddingToBottom = 100;
      const isCloseToBottom =
        layoutMeasurement.height + contentOffset.y >= contentSize.height - paddingToBottom;

      if (isCloseToBottom && hasNextPage && !isFetchingNextPage) {
        fetchNextPage();
      }
    },
    [hasNextPage, isFetchingNextPage, fetchNextPage]
  );

  // Flatten all pages into a single array
  const recipes = useMemo(() => data?.pages.flatMap((page) => page) ?? [], [data?.pages]);

  // Distribute recipes into two columns based on shortest column algorithm
  // This creates true masonry where columns are independent
  const columns = useMemo(() => {
    const leftColumn: Recipe[] = [];
    const rightColumn: Recipe[] = [];
    const columnHeights = [0, 0]; // Track approximate height of each column

    recipes.forEach((recipe) => {
      // Calculate approximate card height for this recipe
      // Hash-based like in RecipeCard component
      const hash = recipe.id.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
      const heightVariations = [180, 200, 220, 240, 260, 280];
      const baseHeight = heightVariations[hash % heightVariations.length];
      const offset = (hash * 17) % 40;
      const imageHeight = baseHeight + offset;

      // Approximate total card height (image + content padding + text)
      const approxCardHeight = imageHeight + 120; // 120px for content area

      // Add to shorter column
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

  // Loading state (initial load)
  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-surface">
        <ActivityIndicator size="large" color="#334d43" />
        <Text className="mt-4 text-foreground-secondary">Loading recipes...</Text>
      </View>
    );
  }

  // Error state
  if (error) {
    return (
      <View className="flex-1 items-center justify-center bg-surface p-6 gap-4">
        <Warning size={64} color="#ef4444" weight="duotone" />
        <Text className="text-xl font-playfair-bold text-foreground-heading text-center">
          Oops! Something went wrong
        </Text>
        <Text className="text-foreground-secondary text-center">
          {error.message || "Failed to load recipes"}
        </Text>
        <Pressable
          onPress={handleRetry}
          className="bg-primary rounded-lg px-6 py-3 active:opacity-80"
        >
          <Text className="text-white font-semibold">Try Again</Text>
        </Pressable>
      </View>
    );
  }

  // Empty state
  if (recipes.length === 0) {
    return (
      <View className="flex-1 items-center justify-center bg-surface p-6 gap-4">
        <Plus size={64} color="#334d43" weight="duotone" />
        <Text className="text-xl font-playfair-bold text-foreground-heading text-center">
          No recipes yet!
        </Text>
        <Text className="text-foreground-secondary text-center">
          Tap the + button below to create your first recipe
        </Text>
      </View>
    );
  }

  return (
    <ScrollView
      className="flex-1 bg-surface"
      showsVerticalScrollIndicator={false}
      onScroll={handleScroll}
      scrollEventThrottle={16}
      refreshControl={
        <RefreshControl
          refreshing={isRefetching}
          onRefresh={handleRefresh}
          tintColor="#334d43"
          colors={["#334d43"]}
        />
      }
    >
      {/* True masonry: two independent columns side by side */}
      <View className="flex-row p-2 gap-2">
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
      {isFetchingNextPage && (
        <View className="py-4 items-center">
          <ActivityIndicator size="small" color="#334d43" />
        </View>
      )}
    </ScrollView>
  );
}
