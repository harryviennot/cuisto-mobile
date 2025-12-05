/**
 * Cooking History Screen
 *
 * Full-page view of the user's cooking history with:
 * - Grid/List view toggle
 * - Masonry grid layout or list view
 * - Sticky header with back button
 * - Pull-to-refresh and infinite scroll
 * - Empty state
 */
import React, { useState, useMemo, useCallback } from "react";
import { View, RefreshControl } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Animated, {
  FadeIn,
  useSharedValue,
  useAnimatedScrollHandler,
} from "react-native-reanimated";
import { useTranslation } from "react-i18next";

import { useCookingHistoryInfinite } from "@/hooks/useCookingHistory";
import { MasonryGrid } from "@/components/home/MasonryGrid";
import {
  CollectionStickyHeader,
  CollectionLoadingSkeleton,
  CollectionErrorState,
  CollectionHeader,
  CookingHistoryListItem,
  CookingHistoryListItemSkeleton,
  CookingHistoryEmpty,
  ViewToggle,
} from "@/components/library";
import type { ViewMode } from "@/components/library";
import type { CookingHistoryEvent } from "@/types/cookingHistory";
import type { Recipe } from "@/types/recipe";

const VIEW_PREFERENCE_KEY = "cooking_history_view_mode";

export default function CookingHistoryScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  // View mode state (persisted to AsyncStorage)
  const [viewMode, setViewMode] = useState<ViewMode>("grid");

  // Load saved view preference
  React.useEffect(() => {
    AsyncStorage.getItem(VIEW_PREFERENCE_KEY).then((value) => {
      if (value === "grid" || value === "list") {
        setViewMode(value);
      }
    });
  }, []);

  const handleViewModeChange = useCallback((mode: ViewMode) => {
    setViewMode(mode);
    AsyncStorage.setItem(VIEW_PREFERENCE_KEY, mode);
  }, []);

  // Fetch cooking history with infinite scroll
  const {
    data,
    isLoading,
    error,
    refetch,
    isRefetching,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useCookingHistoryInfinite();

  // Flatten pages for display
  const events = useMemo(() => {
    return data?.pages.flatMap((page) => page) ?? [];
  }, [data]);

  // Convert CookingHistoryEvent to Recipe-like format for MasonryGrid
  const mapToRecipe = useCallback((event: CookingHistoryEvent): Recipe => {
    return {
      id: event.recipe_id,
      created_by: "",
      title: event.recipe_title,
      image_url: event.cooking_image_url || event.recipe_image_url,
      difficulty: event.difficulty as Recipe["difficulty"],
      ingredients: [],
      instructions: [],
      tags: [],
      rating_count: 0,
      total_times_cooked: event.times_cooked,
      created_at: event.cooked_at,
      updated_at: event.cooked_at,
      user_data: {
        is_favorite: false,
        times_cooked: event.times_cooked,
        rating: event.rating,
      },
    };
  }, []);

  const mappedRecipes = useMemo(
    () => events.map(mapToRecipe),
    [events, mapToRecipe]
  );

  // Scroll handling for sticky header
  const scrollY = useSharedValue(0);
  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
    },
  });

  const handleBack = () => router.back();

  const handleRefresh = useCallback(async () => {
    await refetch();
  }, [refetch]);

  const handleEndReached = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const headerTopPadding = insets.top + 60;

  // Header component with view toggle
  const ListHeaderComponent = useMemo(
    () => (
      <View>
        <CollectionHeader
          subtitle={t("cookingHistory.subtitle") || "RECENTLY COOKED"}
          title={t("cookingHistory.title")}
          topPadding={headerTopPadding}
        />
        <View className="flex-row justify-end px-5 pb-3">
          <ViewToggle value={viewMode} onChange={handleViewModeChange} />
        </View>
      </View>
    ),
    [t, headerTopPadding, viewMode, handleViewModeChange]
  );

  // Render list item for list view
  const renderListItem = useCallback(
    ({ item }: { item: CookingHistoryEvent }) => (
      <CookingHistoryListItem event={item} />
    ),
    []
  );

  // Loading skeleton for list view
  const ListLoadingSkeleton = () => (
    <View style={{ paddingTop: headerTopPadding }}>
      {[1, 2, 3, 4, 5].map((i) => (
        <CookingHistoryListItemSkeleton key={i} />
      ))}
    </View>
  );

  return (
    <View className="flex-1 bg-surface">
      <Animated.View entering={FadeIn.duration(300)} className="flex-1">
        {isLoading ? (
          viewMode === "grid" ? (
            <CollectionLoadingSkeleton topPadding={headerTopPadding} />
          ) : (
            <ListLoadingSkeleton />
          )
        ) : error ? (
          <CollectionErrorState
            errorMessage={error.message}
            onRetry={handleRefresh}
          />
        ) : events.length === 0 ? (
          <View style={{ paddingTop: headerTopPadding }}>
            <CookingHistoryEmpty variant="full" />
          </View>
        ) : viewMode === "grid" ? (
          <MasonryGrid
            recipes={mappedRecipes}
            refreshing={isRefetching}
            onRefresh={handleRefresh}
            onEndReached={handleEndReached}
            showLoadingFooter={isFetchingNextPage}
            ListHeaderComponent={ListHeaderComponent}
            onScroll={scrollHandler}
            refreshControlOffset={headerTopPadding}
            contentContainerStyle={{ paddingBottom: 100 }}
          />
        ) : (
          <Animated.FlatList
            data={events}
            keyExtractor={(item) => item.event_id}
            renderItem={renderListItem}
            ListHeaderComponent={ListHeaderComponent}
            onScroll={scrollHandler}
            scrollEventThrottle={16}
            onEndReached={handleEndReached}
            onEndReachedThreshold={0.5}
            refreshControl={
              <RefreshControl
                refreshing={isRefetching}
                onRefresh={handleRefresh}
                tintColor="#334d43"
                progressViewOffset={headerTopPadding}
              />
            }
            contentContainerStyle={{ paddingBottom: 100 }}
          />
        )}
      </Animated.View>

      <CollectionStickyHeader
        title={t("cookingHistory.title")}
        scrollY={scrollY}
        onBackPress={handleBack}
      />
    </View>
  );
}
