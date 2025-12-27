/**
 * Home Screen - Discovery Feed
 *
 * Displays a discovery feed with trending, most extracted, and highest rated recipes.
 * Features horizontal preview sections and an infinite scroll masonry grid.
 * Sections only appear when they have sufficient content (minimum 3 recipes).
 *
 * Includes category filtering: when a category is selected, hides discovery sections
 * and shows recipes from that category sorted by popularity.
 */
import { View, Text, ActivityIndicator, Pressable, TouchableOpacity } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useCallback, useMemo, useRef, useEffect } from "react";
import { WarningIcon, MagnifyingGlassIcon, ChefHatIcon, Faders } from "phosphor-react-native";
import { router } from "expo-router";
import { useAnimatedScrollHandler, useSharedValue, useDerivedValue } from "react-native-reanimated";

import { MasonryGrid, type MasonryGridRef } from "@/components/home/MasonryGrid";
import { useDiscovery } from "@/hooks/useDiscovery";
import { useCategories } from "@/hooks/useCategories";
import { useCategoryFilter } from "@/hooks/useCategoryFilter";
import { UnifiedStickyHeader } from "@/components/ui/UnifiedStickyHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import {
  TimeGreeting,
  TrendingThisWeekSection,
  TrendingOnSocialsSection,
  PopularOnlineSection,
  HighestRatedSection,
  CategorySelector,
} from "@/components/home";
import { DISCOVERY_CONSTANTS } from "@/types/discovery";
import { useTranslation } from "react-i18next";

export default function Index() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();

  // Header padding calculation
  const headerTopPadding = insets.top + 28;

  // Scroll tracking for header animation
  // Initialize to -headerTopPadding to match contentOffset initial position
  const scrollY = useSharedValue(-headerTopPadding);

  // Use discovery hook for all home page data
  const { trending, socials, online, rated, recent, isInitialLoading, isRefetching, refetchAll } =
    useDiscovery();

  // Category filtering
  const { data: categories = [], isLoading: categoriesLoading } = useCategories();
  const categoryFilter = useCategoryFilter();

  // Ref to the masonry grid for scroll control
  const gridRef = useRef<MasonryGridRef>(null);

  // Scroll to top when category changes
  useEffect(() => {
    // Scroll to top with the correct offset to account for contentInset
    gridRef.current?.scrollToOffset(-headerTopPadding, true);
  }, [categoryFilter.selectedCategoryId, headerTopPadding]);

  // Scroll handler for header animation
  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
    },
  });

  // Adjust scrollY for the header animation because contentInset shifts the origin
  const adjustedScrollY = useDerivedValue(() => {
    return scrollY.value + headerTopPadding;
  });

  // Handle pull-to-refresh
  const handleRefresh = useCallback(async () => {
    if (categoryFilter.isFiltering) {
      await categoryFilter.refetch();
    } else {
      await refetchAll();
    }
  }, [refetchAll, categoryFilter]);

  // Handle infinite scroll
  const handleEndReached = useCallback(() => {
    if (categoryFilter.isFiltering) {
      if (categoryFilter.hasNextPage && !categoryFilter.isFetchingNextPage) {
        categoryFilter.fetchNextPage();
      }
    } else {
      if (recent.hasNextPage && !recent.isFetchingNextPage) {
        recent.fetchNextPage();
      }
    }
  }, [recent, categoryFilter]);

  // Navigate to search overlay
  const handleSearchPress = useCallback(() => {
    router.push("/search");
  }, []);

  // Check if any horizontal section has enough data
  const hasAnySectionData = useMemo(() => {
    const minItems = DISCOVERY_CONSTANTS.MIN_SECTION_RECIPES;
    return (
      (trending.data?.length ?? 0) >= minItems ||
      (socials.data?.length ?? 0) >= minItems ||
      (online.data?.length ?? 0) >= minItems ||
      (rated.data?.length ?? 0) >= minItems
    );
  }, [trending.data, socials.data, online.data, rated.data]);

  // Header icon (shared between PageHeader and UnifiedStickyHeader)
  const headerRightElement = useMemo(
    () => (
      <TouchableOpacity onPress={handleSearchPress} activeOpacity={0.7}>
        <MagnifyingGlassIcon size={24} color="#3a3226" weight="bold" />
      </TouchableOpacity>
    ),
    [handleSearchPress]
  );

  // Get the grid data and section title based on filter state
  const gridRecipes = categoryFilter.isFiltering ? categoryFilter.recipes : recent.data;
  const gridLoading = categoryFilter.isFiltering ? categoryFilter.isLoading : recent.isLoading;
  const gridFetchingNextPage = categoryFilter.isFiltering
    ? categoryFilter.isFetchingNextPage
    : recent.isFetchingNextPage;

  // Discovery sections header component
  const ListHeaderComponent = useMemo(
    () => (
      <View>
        {/* Time-based greeting */}
        <TimeGreeting rightElement={headerRightElement} />

        {/* Category Selector - always visible */}
        <View className="mb-4">
          <CategorySelector
            categories={categories}
            selectedCategoryId={categoryFilter.selectedCategoryId}
            onSelectCategory={categoryFilter.selectCategory}
            isLoading={categoriesLoading}
          />
        </View>

        {/* Discovery sections - only show when NOT filtering by category */}
        {!categoryFilter.isFiltering && (
          <>
            <TrendingThisWeekSection
              data={trending.data}
              isLoading={trending.isLoading}
              isError={trending.isError}
            />

            <TrendingOnSocialsSection
              data={socials.data}
              isLoading={socials.isLoading}
              isError={socials.isError}
            />

            <PopularOnlineSection
              data={online.data}
              isLoading={online.isLoading}
              isError={online.isError}
            />

            <HighestRatedSection
              data={rated.data}
              isLoading={rated.isLoading}
              isError={rated.isError}
            />
          </>
        )}

        {/* Section divider before recipe grid */}
        {(gridRecipes.length > 0 || hasAnySectionData || categoryFilter.isFiltering) && (
          <View className="mb-4 flex-row items-center gap-3 px-6">
            <Text className="font-bold shrink-0 text-sm uppercase tracking-widest text-foreground-tertiary">
              {categoryFilter.isFiltering
                ? t("discovery.sections.popular.title")
                : t("discovery.sections.recent.title")}
            </Text>
            <View className="h-px flex-1 bg-border-light" />
          </View>
        )}
      </View>
    ),
    [
      trending,
      socials,
      online,
      rated,
      gridRecipes.length,
      hasAnySectionData,
      headerRightElement,
      t,
      categories,
      categoriesLoading,
      categoryFilter.selectedCategoryId,
      categoryFilter.selectCategory,
      categoryFilter.isFiltering,
    ]
  );

  // Loading state (initial load)
  if (isInitialLoading && recent.data.length === 0) {
    return (
      <View
        className="flex-1 items-center justify-center bg-surface"
        style={{ paddingTop: insets.top }}
      >
        <ActivityIndicator size="large" color="#334d43" />
        <Text className="mt-4 text-foreground-secondary">{t("discovery.loading")}</Text>
      </View>
    );
  }

  // Error state (only show if all sections fail and no cached data)
  if (
    trending.isError &&
    socials.isError &&
    online.isError &&
    rated.isError &&
    recent.isError &&
    recent.data.length === 0
  ) {
    return (
      <View
        className="flex-1 items-center justify-center bg-surface p-6 gap-4"
        style={{ paddingTop: insets.top }}
      >
        <WarningIcon size={64} color="#ef4444" weight="duotone" />
        <Text className="text-xl font-playfair-bold text-foreground-heading text-center">
          {t("discovery.error.title")}
        </Text>
        <Text className="text-foreground-secondary text-center">
          {t("discovery.error.message")}
        </Text>
        <Pressable
          onPress={handleRefresh}
          className="bg-primary rounded-lg px-6 py-3 active:opacity-80"
        >
          <Text className="text-white font-semibold">{t("common.tryAgain")}</Text>
        </Pressable>
      </View>
    );
  }

  // Empty state - no public recipes at all
  const showEmptyState = !isInitialLoading && !hasAnySectionData && recent.data.length === 0;

  if (showEmptyState) {
    return (
      <View className="flex-1 bg-surface" style={{ paddingTop: insets.top }}>
        <EmptyState
          icon={ChefHatIcon}
          title={t("discovery.empty.title")}
          message={t("discovery.empty.message")}
          ctaLabel={t("discovery.empty.cta")}
          onCtaPress={() => router.push("/(protected)/(tabs)/new-recipe")}
        />
      </View>
    );
  }

  // Empty state component for filtered results
  const FilteredEmptyComponent = useMemo(() => {
    if (categoryFilter.isFiltering && !categoryFilter.isLoading && gridRecipes.length === 0) {
      return (
        <View className="items-center justify-center py-16 px-6">
          <Faders size={56} color="#8a8177" weight="duotone" />
          <Text className="text-foreground-secondary text-center mt-4 text-base font-medium">
            {t("discovery.categoryEmpty.message")}
          </Text>
          <Pressable
            onPress={() => categoryFilter.clearFilter()}
            className="mt-6 bg-primary/10 px-6 py-3 rounded-full active:opacity-70"
          >
            <Text className="text-primary font-semibold">
              {t("discovery.categoryEmpty.showAll")}
            </Text>
          </Pressable>
        </View>
      );
    }
    // Default empty state for discovery feed
    if (!gridLoading && hasAnySectionData && gridRecipes.length === 0) {
      return (
        <View className="py-8 items-center">
          <Text className="text-foreground-tertiary text-center">
            {t("discovery.noRecipes.message")}
          </Text>
        </View>
      );
    }
    return undefined;
  }, [categoryFilter, gridRecipes.length, gridLoading, hasAnySectionData, t]);

  return (
    <View className="flex-1 bg-surface">
      {/* Recipe Grid with discovery sections as header */}
      <MasonryGrid
        ref={gridRef}
        recipes={gridRecipes}
        loading={gridLoading}
        refreshing={isRefetching}
        onRefresh={handleRefresh}
        onEndReached={handleEndReached}
        showLoadingFooter={gridFetchingNextPage}
        ListEmptyComponent={FilteredEmptyComponent}
        ListHeaderComponent={ListHeaderComponent}
        onScroll={scrollHandler}
        contentInset={{ top: headerTopPadding }}
        contentOffset={{ x: 0, y: -headerTopPadding }}
        scrollIndicatorInsets={{ top: headerTopPadding }}
        contentContainerStyle={{
          paddingBottom: 100,
        }}
      />

      {/* Animated Sticky Header */}
      <UnifiedStickyHeader
        title={t("discovery.stickyHeader")}
        scrollY={adjustedScrollY}
        leftElement={<View className="w-10" />}
        rightElement={headerRightElement}
      />
    </View>
  );
}
