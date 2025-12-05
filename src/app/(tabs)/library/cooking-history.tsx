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
import { View, RefreshControl, SectionList } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import Animated, {
  FadeIn,
  useSharedValue,
  useAnimatedScrollHandler,
  useDerivedValue,
} from "react-native-reanimated";
import { useTranslation } from "react-i18next";

import { useCookingHistoryInfinite } from "@/hooks/useCookingHistory";
import {
  CollectionStickyHeader,
  CollectionErrorState,
  CollectionHeader,
} from "@/components/library";
import {
  CookingHistoryListItem,
  CookingHistoryListItemSkeleton,
  CookingHistoryEmpty,
  CookingHistoryMonthHeader,
  groupEventsToSections,
  CookingHistorySection,
} from "@/components/library/cooking-history";

const AnimatedSectionList = Animated.createAnimatedComponent(SectionList);

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

  // Group pages for display
  const sections = useMemo(() => {
    const flatEvents = data?.pages.flatMap((page) => page) ?? [];
    return groupEventsToSections(flatEvents);
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

  // 52 is roughly the height of CollectionStickyHeader content (40px button + 12px paddingBottom)
  const headerTopPadding = insets.top + 47;

  // Adjust scrollY for the header animation because contentInset shifts the origin
  const adjustedScrollY = useDerivedValue(() => {
    return scrollY.value + headerTopPadding;
  });

  // Header component
  const ListHeaderComponent = useMemo(
    () => (
      <View>
        <CollectionHeader
          subtitle={t("cookingHistory.subtitle") || "RECENTLY COOKED"}
          title={t("cookingHistory.title")}
          topPadding={0} // Content handled by contentInset
        />
      </View>
    ),
    [t]
  );

  // Render list item
  const renderItem = useCallback(
    ({ item }: { item: any }) => (
      <CookingHistoryListItem event={item} />
    ),
    []
  );

  // Render section header
  const renderSectionHeader = useCallback(
    ({ section: { title } }: { section: CookingHistorySection }) => (
      <CookingHistoryMonthHeader label={title} />
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
        ) : sections.length === 0 ? (
          <View style={{ paddingTop: headerTopPadding }}>
            <CookingHistoryEmpty variant="full" />
          </View>
        ) : (
          <AnimatedSectionList
            sections={sections}
            keyExtractor={(item: any) => item.event_id}
            renderItem={renderItem}
            renderSectionHeader={renderSectionHeader}
            ListHeaderComponent={ListHeaderComponent}
            stickySectionHeadersEnabled={true}
            onScroll={scrollHandler}
            scrollEventThrottle={16}
            onEndReached={handleEndReached}
            onEndReachedThreshold={0.5}
            // Use contentInset to handle sticky header offset below navbar
            contentInset={{ top: headerTopPadding }}
            contentOffset={{ x: 0, y: -headerTopPadding }}
            scrollIndicatorInsets={{ top: headerTopPadding }}
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
        scrollY={adjustedScrollY}
        onBackPress={handleBack}
      />
    </View>
  );
}
