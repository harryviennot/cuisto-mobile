/**
 * Discovery "See All" Screen
 *
 * Dynamic route for viewing full lists of discovery sections:
 * - /discovery/trending - Trending This Week
 * - /discovery/socials - Trending on Socials
 * - /discovery/online - Popular Recipes Online
 * - /discovery/rated - Highest Rated
 */
import React, { useMemo, useCallback } from "react";
import { View, Text, ActivityIndicator, Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { WarningCircle } from "phosphor-react-native";
import { useTranslation } from "react-i18next";
import {
  useSharedValue,
  useAnimatedScrollHandler,
  useDerivedValue,
} from "react-native-reanimated";
import { useInfiniteQuery } from "@tanstack/react-query";

import { MasonryGrid } from "@/components/home/MasonryGrid";
import { UnifiedStickyHeader } from "@/components/ui/UnifiedStickyHeader";
import { PageHeader } from "@/components/ui/PageHeader";
import { discoveryService } from "@/api/services/discovery.service";
import type { Recipe } from "@/types/recipe";
import type { DiscoverySectionType } from "@/types/discovery";

const PAGE_SIZE = 20;

// Translation keys for each discovery type
const DISCOVERY_TRANSLATION_KEYS: Record<DiscoverySectionType, string> = {
  trending: "trending",
  socials: "socials",
  online: "online",
  rated: "rated",
};

// Fetch functions for each discovery type
const DISCOVERY_FETCH_FNS: Record<
  DiscoverySectionType,
  (limit: number, offset: number) => Promise<Recipe[]>
> = {
  trending: (limit, offset) => discoveryService.getTrendingThisWeek(limit, offset),
  socials: (limit, offset) => discoveryService.getTrendingOnSocials(limit, offset),
  online: (limit, offset) => discoveryService.getPopularOnline(limit, offset),
  rated: (limit, offset) => discoveryService.getHighestRated(limit, offset),
};

export default function DiscoverySeeAllScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const { type } = useLocalSearchParams<{ type: DiscoverySectionType }>();

  // Get config for this discovery type
  const sectionType = (type as DiscoverySectionType) || "trending";
  const translationKey = DISCOVERY_TRANSLATION_KEYS[sectionType] || "trending";
  const fetchFn = DISCOVERY_FETCH_FNS[sectionType] || DISCOVERY_FETCH_FNS.trending;

  const title = t(`discovery.sections.${translationKey}.title` as any) as string;
  const subtitle = t(`discovery.sections.${translationKey}.subtitle` as any) as string;

  // Scroll handler for sticky header
  const scrollY = useSharedValue(0);
  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
    },
  });

  const headerTopPadding = insets.top + 60;
  const adjustedScrollY = useDerivedValue(() => {
    return scrollY.value + headerTopPadding;
  });

  // Infinite query for full list
  const {
    data,
    isLoading,
    isError,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch,
    isRefetching,
  } = useInfiniteQuery<Recipe[], Error>({
    queryKey: ["discovery", `${sectionType}-all`],
    queryFn: async ({ pageParam = 0 }) => {
      const offset = pageParam as number;
      return fetchFn(PAGE_SIZE, offset);
    },
    getNextPageParam: (lastPage, allPages) => {
      if (lastPage.length < PAGE_SIZE) {
        return undefined;
      }
      return allPages.length * PAGE_SIZE;
    },
    initialPageParam: 0,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  // Flatten pages
  const recipes = data?.pages.flat() ?? [];

  // Handlers
  const handleBack = useCallback(() => router.back(), [router]);

  const handleRefresh = useCallback(async () => {
    await refetch();
  }, [refetch]);

  const handleEndReached = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const ListHeaderComponent = useMemo(
    () => (
      <PageHeader
        subtitle={subtitle}
        title={title}
        topPadding={0}
      />
    ),
    [subtitle, title]
  );

  // Loading state
  if (isLoading) {
    return (
      <View
        className="flex-1 items-center justify-center bg-surface"
        style={{ paddingTop: insets.top }}
      >
        <ActivityIndicator size="large" color="#334d43" />
        <Text className="mt-4 text-foreground-secondary">{t("common.loading")}</Text>
      </View>
    );
  }

  // Error state
  if (isError) {
    return (
      <View
        className="flex-1 items-center justify-center bg-surface p-6 gap-4"
        style={{ paddingTop: insets.top }}
      >
        <UnifiedStickyHeader
          title={title}
          scrollY={adjustedScrollY}
          onBackPress={handleBack}
        />
        <WarningCircle size={64} color="#ef4444" weight="duotone" />
        <Text className="text-xl font-playfair-bold text-foreground-heading text-center">
          {t("discovery.error.title")}
        </Text>
        <Text className="text-foreground-secondary text-center">
          {error?.message || t("discovery.error.message")}
        </Text>
        <Pressable
          onPress={() => refetch()}
          className="bg-primary rounded-lg px-6 py-3 active:opacity-80"
        >
          <Text className="text-white font-semibold">{t("common.tryAgain")}</Text>
        </Pressable>
      </View>
    );
  }

  // Empty state
  if (recipes.length === 0) {
    return (
      <View className="flex-1 bg-surface" style={{ paddingTop: insets.top }}>
        <UnifiedStickyHeader
          title={title}
          scrollY={adjustedScrollY}
          onBackPress={handleBack}
        />
        <View className="flex-1 items-center justify-center p-6">
          <Text className="text-xl font-playfair-bold text-foreground-heading text-center">
            {t("discovery.noRecipes.title")}
          </Text>
          <Text className="text-foreground-secondary text-center mt-2">
            {t("discovery.noRecipes.message")}
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-surface">
      <MasonryGrid
        recipes={recipes}
        refreshing={isRefetching}
        onRefresh={handleRefresh}
        onEndReached={handleEndReached}
        showLoadingFooter={isFetchingNextPage}
        ListHeaderComponent={ListHeaderComponent}
        onScroll={scrollHandler}
        contentInset={{ top: headerTopPadding }}
        contentOffset={{ x: 0, y: -headerTopPadding }}
        scrollIndicatorInsets={{ top: headerTopPadding }}
        contentContainerStyle={{
          paddingBottom: 100,
        }}
      />

      <UnifiedStickyHeader
        title={title}
        scrollY={adjustedScrollY}
        onBackPress={handleBack}
      />
    </View>
  );
}
