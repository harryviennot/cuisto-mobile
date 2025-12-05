import {
  View,
  RefreshControl,
  ActivityIndicator,
  Platform,
  useWindowDimensions,
} from "react-native";
import Animated from "react-native-reanimated";
import { useMemo, type ReactElement } from "react";
import { RecipeCard } from "../recipe/RecipeCard";
import type { Recipe } from "@/types/recipe";

export interface MasonryGridProps {
  recipes: Recipe[];
  loading?: boolean;
  refreshing?: boolean;
  onRefresh?: () => void;
  onEndReached?: () => void;
  onEndReachedThreshold?: number;
  showLoadingFooter?: boolean;
  onScroll?: any;
  ListEmptyComponent?: ReactElement;
  ListHeaderComponent?: ReactElement;
  contentContainerStyle?: any;
  stickyHeaderIndices?: number[];
  stickyHeaderHiddenOnScroll?: boolean;
  refreshControlOffset?: number;
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
  contentContainerStyle,
  stickyHeaderIndices,
  stickyHeaderHiddenOnScroll = false,
  refreshControlOffset = 0,
}: MasonryGridProps) {
  const { width } = useWindowDimensions();

  // Calculate number of columns based on device type and screen width
  const numColumns = useMemo(() => {
    const isTablet = Platform.OS === "ios" && Platform.isPad;

    if (!isTablet) {
      // iPhone/iPod: always 2 columns
      return 2;
    }

    // iPad: calculate based on width (max 5 columns)
    // Assuming minimum column width of ~300px for good UX
    const minColumnWidth = 250;
    const padding = 32; // Account for horizontal padding
    const gap = 8; // Gap between columns

    const availableWidth = width - padding;
    const calculatedColumns = Math.floor((availableWidth + gap) / (minColumnWidth + gap));

    return Math.min(Math.max(calculatedColumns, 2), 5);
  }, [width]);

  // Distribute recipes into columns for masonry layout
  const columns = useMemo(() => {
    const columnArrays: Recipe[][] = Array.from({ length: numColumns }, () => []);
    const columnHeights: number[] = Array(numColumns).fill(0);

    recipes.forEach((recipe) => {
      // Generate consistent but varied heights based on recipe ID
      const hash = recipe.id.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
      const heightVariations = [180, 200, 220, 240, 260, 280];
      const baseHeight = heightVariations[hash % heightVariations.length];
      const offset = (hash * 17) % 40;
      const imageHeight = baseHeight + offset;
      // Approximate total card height (image + metadata section)
      const approxCardHeight = imageHeight + 120;

      // Find the shortest column and add recipe to it
      const shortestColumnIndex = columnHeights.indexOf(Math.min(...columnHeights));
      columnArrays[shortestColumnIndex].push(recipe);
      columnHeights[shortestColumnIndex] += approxCardHeight;
    });

    return columnArrays;
  }, [recipes, numColumns]);

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

  // Create data array for FlatList - single item containing all columns
  const data = [{ id: "masonry-grid", columns }];

  return (
    <Animated.FlatList
      data={data}
      keyExtractor={(item) => item.id}
      showsVerticalScrollIndicator={false}
      onScroll={onScroll}
      scrollEventThrottle={16}
      contentContainerStyle={contentContainerStyle}
      stickyHeaderIndices={stickyHeaderIndices}
      stickyHeaderHiddenOnScroll={stickyHeaderHiddenOnScroll}
      onEndReached={onEndReached}
      onEndReachedThreshold={onEndReachedThreshold ? onEndReachedThreshold / 1000 : 0.1}
      ListHeaderComponent={ListHeaderComponent}
      refreshControl={
        onRefresh ? (
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#334d43"
            colors={["#334d43"]}
            progressViewOffset={refreshControlOffset}
          />
        ) : undefined
      }
      renderItem={({ item }: { item: { id: string; columns: Recipe[][] } }) => (
        <View className="flex-row p-4 gap-2">
          {item.columns.map((columnRecipes, columnIndex) => (
            <View
              key={`column-${columnIndex}`}
              className="flex-1 gap-2"
              style={{ marginHorizontal: 4 }}
            >
              {columnRecipes.map((recipe, recipeIndex) => (
                <RecipeCard
                  key={recipe.id}
                  recipe={recipe}
                  index={columnIndex + recipeIndex * numColumns}
                />
              ))}
            </View>
          ))}
        </View>
      )}
      ListFooterComponent={
        showLoadingFooter ? (
          <View className="py-4 items-center">
            <ActivityIndicator size="small" color="#334d43" />
          </View>
        ) : null
      }
    />
  );
}
