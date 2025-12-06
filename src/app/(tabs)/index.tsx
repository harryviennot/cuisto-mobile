/**
 * Home Screen
 *
 * Displays the user's recipe collection in a masonry grid layout.
 * Features animated sticky header with blur effect on scroll.
 */
import { useTranslation } from "react-i18next";
import { View, Text, ActivityIndicator, Pressable, TouchableOpacity } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useCallback, useMemo } from "react";
import { PlusIcon, WarningIcon, MagnifyingGlassIcon } from "phosphor-react-native";
import { useQueryClient } from "@tanstack/react-query";
import { router } from "expo-router";
import { useAnimatedScrollHandler, useSharedValue, useDerivedValue } from "react-native-reanimated";

import { MasonryGrid } from "@/components/home/MasonryGrid";
import { useRecipes } from "@/hooks/useRecipes";
import { useAuth } from "@/contexts/AuthContext";
import { UnifiedStickyHeader } from "@/components/ui/UnifiedStickyHeader";
import { PageHeader } from "@/components/ui/PageHeader";

export default function Index() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const { isAuthenticated } = useAuth();

  // Scroll tracking for header animation
  const scrollY = useSharedValue(0);

  // Use recipes hook for all recipes view
  // Only fetch when authenticated to prevent requests during auth redirect
  const {
    data,
    isLoading,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch,
    isRefetching,
  } = useRecipes({ enabled: isAuthenticated });

  // Scroll handler for header animation
  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
    },
  });

  // 52 is roughly the height of UnifiedStickyHeader content (40px button + 12px paddingBottom)
  const headerTopPadding = insets.top + 28;

  // Adjust scrollY for the header animation because contentInset shifts the origin
  const adjustedScrollY = useDerivedValue(() => {
    return scrollY.value + headerTopPadding;
  });

  // Handle pull-to-refresh
  const handleRefresh = useCallback(async () => {
    queryClient.setQueryData(["recipes"], (oldData: any) => {
      if (!oldData) return oldData;
      return {
        pages: oldData.pages.slice(0, 1),
        pageParams: oldData.pageParams.slice(0, 1),
      };
    });
    await refetch();
  }, [refetch, queryClient]);

  // All recipes - deduplicate by ID to handle any backend duplicates
  const allRecipes = data?.pages.flatMap((page) => page) ?? [];
  const uniqueRecipes = Array.from(
    new Map(allRecipes.map((recipe) => [recipe.id, recipe])).values()
  );

  // Handle infinite scroll
  const handleEndReached = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  // Navigate to search overlay
  const handleSearchPress = useCallback(() => {
    router.push("/search");
  }, []);

  const handleRetry = useCallback(async () => {
    queryClient.setQueryData(["recipes"], (oldData: any) => {
      if (!oldData) return oldData;
      return {
        pages: oldData.pages.slice(0, 1),
        pageParams: oldData.pageParams.slice(0, 1),
      };
    });
    await refetch();
  }, [refetch, queryClient]);

  // Header icon (shared between PageHeader and UnifiedStickyHeader)
  const headerRightElement = useMemo(
    () => (
      <TouchableOpacity onPress={handleSearchPress} activeOpacity={0.7}>
        <MagnifyingGlassIcon size={24} color="#3a3226" weight="bold" />
      </TouchableOpacity>
    ),
    [handleSearchPress]
  );

  // Large header component
  const ListHeaderComponent = useMemo(
    () => (
      <PageHeader
        subtitle={t("home.subtitle", "HOME")}
        title={t("home.title", "My Recipes")}
        topPadding={0} // Content handled by contentInset
        rightElement={headerRightElement}
      />
    ),
    [t, headerRightElement]
  );

  // Loading state (initial load)
  if (isLoading) {
    return (
      <View
        className="flex-1 items-center justify-center bg-surface"
        style={{ paddingTop: insets.top }}
      >
        <ActivityIndicator size="large" color="#334d43" />
        <Text className="mt-4 text-foreground-secondary">Loading recipes...</Text>
      </View>
    );
  }

  // Error state
  if (error) {
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

  // Empty state component for MasonryGrid
  const EmptyComponent = (
    <View className="flex-1 items-center justify-center p-6 gap-4">
      <PlusIcon size={64} color="#334d43" weight="duotone" />
      <Text className="text-xl font-playfair-bold text-foreground-heading text-center">
        No recipes yet!
      </Text>
      <Text className="text-foreground-secondary text-center">
        Tap the + button below to create your first recipe
      </Text>
    </View>
  );

  return (
    <View className="flex-1 bg-surface">
      {/* Recipe Grid */}
      <MasonryGrid
        recipes={uniqueRecipes}
        refreshing={isRefetching}
        onRefresh={handleRefresh}
        onEndReached={handleEndReached}
        showLoadingFooter={isFetchingNextPage}
        ListEmptyComponent={EmptyComponent}
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
        title={t("home.title", "My Recipes")}
        scrollY={adjustedScrollY}
        leftElement={<View className="w-10" />} // No back button on tab screen
        rightElement={headerRightElement}
      />
    </View>
  );
}
