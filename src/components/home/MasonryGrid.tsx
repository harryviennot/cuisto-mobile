import { View, ActivityIndicator, Platform, useWindowDimensions } from "react-native";
import { FlashList, ListRenderItem } from "@shopify/flash-list";
import Animated from "react-native-reanimated";
import { useMemo, useCallback, type ReactElement } from "react";
import { RecipeCard } from "../recipe/RecipeCard";
import type { Recipe } from "@/types/recipe";

// Create Reanimated-wrapped FlashList for scroll animations
const ReanimatedFlashList = Animated.createAnimatedComponent(FlashList as React.ComponentType<any>);

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
  /** Custom key extractor for recipes. Defaults to recipe.id */
  keyExtractor?: (recipe: Recipe) => string;
  /** Content inset for scroll view */
  contentInset?: { top?: number; left?: number; bottom?: number; right?: number };
  /** Initial content offset */
  contentOffset?: { x: number; y: number };
  /** Scroll indicator insets */
  scrollIndicatorInsets?: { top?: number; left?: number; bottom?: number; right?: number };
  /** Progress view offset for refresh control */
  progressViewOffset?: number;
}

export function MasonryGrid({
  recipes,
  loading = false,
  refreshing = false,
  onRefresh,
  onEndReached,
  onEndReachedThreshold = 0.5,
  showLoadingFooter = false,
  onScroll,
  ListEmptyComponent,
  ListHeaderComponent,
  contentContainerStyle,
  keyExtractor = (recipe) => recipe.id,
  contentInset,
  contentOffset,
  scrollIndicatorInsets,
  progressViewOffset,
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
    // Assuming minimum column width of ~250px for good UX
    const minColumnWidth = 250;
    const padding = 32; // Account for horizontal padding
    const gap = 8; // Gap between columns

    const availableWidth = width - padding;
    const calculatedColumns = Math.floor((availableWidth + gap) / (minColumnWidth + gap));

    return Math.min(Math.max(calculatedColumns, 2), 5);
  }, [width]);

  // Render item function - memoized for performance
  // Wrap in View with padding for horizontal gaps between columns
  const renderItem: ListRenderItem<Recipe> = useCallback(
    ({ item, index }) => (
      <View
        style={{
          paddingBottom: 8,
          paddingHorizontal: 8,
        }}
      >
        <RecipeCard recipe={item} index={index} />
      </View>
    ),
    []
  );

  // Key extractor wrapped in useCallback
  const getItemKey = useCallback((item: Recipe) => keyExtractor(item), [keyExtractor]);

  // Loading footer component
  const ListFooterComponent = useMemo(() => {
    if (!showLoadingFooter) return null;
    return (
      <View className="py-4 items-center">
        <ActivityIndicator size="small" color="#334d43" />
      </View>
    );
  }, [showLoadingFooter]);

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
    <ReanimatedFlashList
      data={recipes}
      renderItem={renderItem}
      keyExtractor={getItemKey}
      numColumns={numColumns}
      masonry
      optimizeItemArrangement
      showsVerticalScrollIndicator={false}
      onScroll={onScroll}
      scrollEventThrottle={16}
      contentContainerStyle={{
        paddingHorizontal: 10,
        ...contentContainerStyle,
      }}
      onEndReached={onEndReached}
      onEndReachedThreshold={onEndReachedThreshold}
      ListHeaderComponent={ListHeaderComponent}
      ListHeaderComponentStyle={{
        marginHorizontal: -10, // Counteract contentContainerStyle padding
      }}
      ListFooterComponent={ListFooterComponent}
      refreshing={refreshing}
      onRefresh={onRefresh}
      contentInset={contentInset}
      contentOffset={contentOffset}
      scrollIndicatorInsets={scrollIndicatorInsets}
      progressViewOffset={progressViewOffset}
    />
  );
}
