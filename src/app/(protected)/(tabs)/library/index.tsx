/**
 * Library Screen
 *
 * Displays user collections (All Recipes, Favorites) with a premium, editorial design.
 * System collections are hardcoded for instant rendering, with counts fetched async.
 * Includes cooking history preview section.
 * Features animated sticky header with blur effect on scroll.
 */
import React, { useState, useMemo, useCallback } from "react";
import { View, RefreshControl, TouchableOpacity } from "react-native";
import { router, Stack } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import { MagnifyingGlassIcon, UserCircleGear, GearSixIcon } from "phosphor-react-native";
import Animated, {
  useSharedValue,
  useAnimatedScrollHandler,
  useDerivedValue,
} from "react-native-reanimated";

import { useCollectionCounts } from "@/hooks/useCollections";
import { SmartCollectionCard, CookingHistoryPreview } from "@/components/library";
import { UnifiedStickyHeader } from "@/components/ui/UnifiedStickyHeader";
import { PageHeader } from "@/components/ui/PageHeader";

export default function LibraryScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const [refreshing, setRefreshing] = useState(false);

  // Fetch only the recipe counts (lightweight)
  const { data: counts, refetch } = useCollectionCounts();

  // 52 is roughly the height of UnifiedStickyHeader content (40px button + 12px paddingBottom)
  const headerTopPadding = insets.top + 28;

  // Scroll handling for sticky header
  // Initialize to -headerTopPadding to match contentOffset initial position
  const scrollY = useSharedValue(-headerTopPadding);
  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
    },
  });

  // Handle pull-to-refresh
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  // Handle search press
  const handleSearchPress = useCallback(() => {
    router.push("/search");
  }, []);

  // Handle user/profile press
  const handleUserPress = useCallback(() => {
    router.push("/settings");
  }, []);

  // Adjust scrollY for the header animation because contentInset shifts the origin
  const adjustedScrollY = useDerivedValue(() => {
    return scrollY.value + headerTopPadding;
  });

  // Header icons (shared between PageHeader and UnifiedStickyHeader)
  const headerRightElement = useMemo(
    () => (
      <View className="flex-row items-center gap-4">
        <TouchableOpacity onPress={handleSearchPress} activeOpacity={0.7}>
          <MagnifyingGlassIcon size={24} color="#3a3226" weight="bold" />
        </TouchableOpacity>
        <TouchableOpacity onPress={handleUserPress} activeOpacity={0.7}>
          <GearSixIcon size={24} color="#3a3226" weight="bold" />
        </TouchableOpacity>
      </View>
    ),
    [handleSearchPress, handleUserPress]
  );

  // Large header component
  const ListHeaderComponent = useMemo(
    () => (
      <PageHeader
        subtitle={t("library.subtitle", "COLLECTION")}
        title={t("library.title", "Library")}
        topPadding={0} // Content handled by contentInset
        rightElement={headerRightElement}
      />
    ),
    [t, headerRightElement]
  );

  return (
    <View className="flex-1 bg-surface">
      <Stack.Screen options={{ headerShown: false }} />

      <Animated.ScrollView
        className="flex-1"
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        contentInset={{ top: headerTopPadding }}
        contentOffset={{ x: 0, y: -headerTopPadding }}
        scrollIndicatorInsets={{ top: headerTopPadding }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor="#334d43"
            progressViewOffset={headerTopPadding}
          />
        }
        contentContainerStyle={{
          paddingBottom: 120, // space for tab bar
        }}
      >
        {/* Large Scrolling Header */}
        {ListHeaderComponent}

        {/* Smart Collections Grid */}
        <View className="flex-row gap-4 px-5">
          <SmartCollectionCard
            slug="extracted"
            count={counts?.extracted}
            variant="primary"
            onPress={() => router.push("/library/collection/extracted")}
          />
          <SmartCollectionCard
            slug="saved"
            count={counts?.saved}
            variant="secondary"
            onPress={() => router.push("/library/collection/saved")}
          />
        </View>

        {/* Cooking History Section */}
        <CookingHistoryPreview
          onSeeMore={() => router.push("/library/cooking-history")}
          style={{ marginTop: 24 }}
        />
      </Animated.ScrollView>

      {/* Animated Sticky Header */}
      <UnifiedStickyHeader
        title={t("library.title", "Library")}
        scrollY={adjustedScrollY}
        leftElement={<View className="w-10" />} // No back button on tab screen
        rightElement={headerRightElement}
      />
    </View>
  );
}
