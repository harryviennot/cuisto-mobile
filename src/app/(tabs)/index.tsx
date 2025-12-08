/**
 * Home Screen - Discovery Feed
 *
 * Displays a discovery feed with trending, most extracted, and highest rated recipes.
 * Features horizontal preview sections and an infinite scroll masonry grid.
 * Sections only appear when they have sufficient content (minimum 3 recipes).
 */
import { View, Text, ActivityIndicator, Pressable, TouchableOpacity } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useCallback, useMemo } from "react";
import { WarningIcon, MagnifyingGlassIcon, ChefHatIcon } from "phosphor-react-native";
import { router } from "expo-router";
import { useAnimatedScrollHandler, useSharedValue, useDerivedValue } from "react-native-reanimated";

import { MasonryGrid } from "@/components/home/MasonryGrid";
import { useDiscovery } from "@/hooks/useDiscovery";
import { UnifiedStickyHeader } from "@/components/ui/UnifiedStickyHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import {
  TimeGreeting,
  TrendingThisWeekSection,
  TrendingOnSocialsSection,
  PopularOnlineSection,
  HighestRatedSection,
} from "@/components/home";
import { DISCOVERY_CONSTANTS } from "@/types/discovery";
import { t } from "i18next";

export default function Index() {
  const insets = useSafeAreaInsets();

  // Scroll tracking for header animation
  const scrollY = useSharedValue(0);

  // Use discovery hook for all home page data
  const { trending, socials, online, rated, recent, isInitialLoading, isRefetching, refetchAll } =
    useDiscovery();

  // Scroll handler for header animation
  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
    },
  });

  // Header padding calculation
  const headerTopPadding = insets.top + 28;

  // Adjust scrollY for the header animation because contentInset shifts the origin
  const adjustedScrollY = useDerivedValue(() => {
    return scrollY.value + headerTopPadding;
  });

  // Handle pull-to-refresh
  const handleRefresh = useCallback(async () => {
    await refetchAll();
  }, [refetchAll]);

  // Handle infinite scroll
  const handleEndReached = useCallback(() => {
    if (recent.hasNextPage && !recent.isFetchingNextPage) {
      recent.fetchNextPage();
    }
  }, [recent]);

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

  // Discovery sections header component
  const ListHeaderComponent = useMemo(
    () => (
      <View>
        {/* Time-based greeting */}
        <TimeGreeting rightElement={headerRightElement} />

        {/* Discovery sections - each section hides itself if not enough data */}
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

        {/* Section divider before recently added grid */}
        {(recent.data.length > 0 || hasAnySectionData) && (
          <View className="mb-4 flex-row items-center gap-3 px-6 mt-2">
            <Text className="font-bold shrink-0 text-sm uppercase tracking-widest text-foreground-tertiary">
              Recently Added
            </Text>
            <View className="h-px flex-1 bg-border-light" />
          </View>
        )}
      </View>
    ),
    [trending, socials, online, rated, recent.data.length, hasAnySectionData, headerRightElement]
  );

  // Loading state (initial load)
  if (isInitialLoading && recent.data.length === 0) {
    return (
      <View
        className="flex-1 items-center justify-center bg-surface"
        style={{ paddingTop: insets.top }}
      >
        <ActivityIndicator size="large" color="#334d43" />
        <Text className="mt-4 text-foreground-secondary">Discovering recipes...</Text>
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
          Oops! Something went wrong
        </Text>
        <Text className="text-foreground-secondary text-center">
          Failed to load recipes. Please try again.
        </Text>
        <Pressable
          onPress={handleRefresh}
          className="bg-primary rounded-lg px-6 py-3 active:opacity-80"
        >
          <Text className="text-white font-semibold">Try Again</Text>
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
          onCtaPress={() => router.push("/(tabs)/new-recipe")}
        />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-surface">
      {/* Recipe Grid with discovery sections as header */}
      <MasonryGrid
        recipes={recent.data}
        refreshing={isRefetching}
        onRefresh={handleRefresh}
        onEndReached={handleEndReached}
        showLoadingFooter={recent.isFetchingNextPage}
        ListEmptyComponent={
          // Only show if we have section data but no recent recipes
          hasAnySectionData ? (
            <View className="py-8 items-center">
              <Text className="text-foreground-tertiary text-center">
                No recent recipes to show
              </Text>
            </View>
          ) : undefined
        }
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
        title="Discover"
        scrollY={adjustedScrollY}
        leftElement={<View className="w-10" />}
        rightElement={headerRightElement}
      />
    </View>
  );
}
