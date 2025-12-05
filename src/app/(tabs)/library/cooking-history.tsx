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
import React, { useMemo, useCallback } from "react";
import { View, RefreshControl } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import Animated, {
  FadeIn,
  useSharedValue,
  useAnimatedScrollHandler,
} from "react-native-reanimated";
import { useTranslation } from "react-i18next";

import { useCookingHistoryInfinite } from "@/hooks/useCookingHistory";
import {
  CollectionStickyHeader,
  CollectionErrorState,
  CollectionHeader,
  CookingHistoryListItem,
  CookingHistoryListItemSkeleton,
  CookingHistoryEmpty,
} from "@/components/library";
import type { CookingHistoryEvent } from "@/types/cookingHistory";



export default function CookingHistoryScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();

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

  // Header component
  const ListHeaderComponent = useMemo(
    () => (
      <View>
        <CollectionHeader
          subtitle={t("cookingHistory.subtitle") || "RECENTLY COOKED"}
          title={t("cookingHistory.title")}
          topPadding={headerTopPadding}
        />
      </View>
    ),
    [t, headerTopPadding]
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
          <ListLoadingSkeleton />
        ) : error ? (
          <CollectionErrorState
            errorMessage={error.message}
            onRetry={handleRefresh}
          />
        ) : events.length === 0 ? (
          <View style={{ paddingTop: headerTopPadding }}>
            <CookingHistoryEmpty variant="full" />
          </View>
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
