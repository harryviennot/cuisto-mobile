/**
 * Collection Detail Screen
 *
 * Displays recipes within a collection with:
 * - Masonry grid layout (Pinterest-style)
 * - Sticky header with animated blur/color transitions
 * - Pull-to-refresh
 * - Loading skeleton and empty/error states
 */
import React, { useMemo, useCallback } from "react";
import { View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SquaresFourIcon, BookmarkIcon, Plus, MagnifyingGlass } from "phosphor-react-native";
import Animated, {
  FadeIn,
  useSharedValue,
  useAnimatedScrollHandler,
} from "react-native-reanimated";
import { useTranslation } from "react-i18next";
import Toast from "react-native-toast-message";

import { useCollectionBySlug } from "@/hooks/useCollections";
import { MasonryGrid } from "@/components/home/MasonryGrid";
import {
  CollectionEmptyState,
  CollectionErrorState,
  CollectionLoadingSkeleton,
} from "@/components/library";
import { UnifiedStickyHeader } from "@/components/ui/UnifiedStickyHeader";
import { PageHeader } from "@/components/ui/PageHeader";
import type { CollectionRecipe } from "@/types/collection";
import type { Recipe } from "@/types/recipe";

export default function CollectionDetailScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  // The route param is [id] but we pass slug values directly
  const { id: slug } = useLocalSearchParams<{ id: string }>();

  // Fetch collection by slug
  const { data, isLoading, error, refetch, isRefetching } = useCollectionBySlug(slug || "");

  // Scroll handler for sticky header animations
  const scrollY = useSharedValue(0);
  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
    },
  });

  // Determine collection type from data or params
  const collectionSlug = data?.collection?.slug || slug || "extracted";

  // Get title and subtitle based on collection slug
  const collectionTitle =
    collectionSlug === "extracted"
      ? t("library.collections.allRecipes")
      : t("library.collections.favorites");
  const collectionSubtitle =
    collectionSlug === "extracted"
      ? t("library.collections.allRecipesSubtitle")
      : t("library.collections.favoritesSubtitle");

  // Convert CollectionRecipe to Recipe format for RecipeCard
  const mapToRecipe = useCallback(
    (cr: CollectionRecipe): Recipe => ({
      id: cr.id,
      created_by: "",
      title: cr.title,
      description: cr.description,
      image_url: cr.image_url,
      servings: cr.servings,
      difficulty: cr.difficulty as Recipe["difficulty"],
      tags: cr.tags,
      source_type: cr.source_type,
      is_public: cr.is_public,
      ingredients: [],
      instructions: [],
      rating_count: 0,
      total_times_cooked: 0,
      created_at: cr.created_at,
      updated_at: cr.created_at,
      timings: cr.timings,
      user_data: {
        is_favorite: slug === "saved",
        times_cooked: 0,
      },
    }),
    [slug]
  );

  const handleBack = () => router.back();

  const handleRefresh = useCallback(async () => {
    try {
      await refetch();
    } catch {
      Toast.show({
        type: "error",
        text1: t("library.error.title"),
        text2: t("common.tryAgain"),
        position: "bottom",
      });
    }
  }, [refetch, t]);

  const handleExtractRecipe = useCallback(() => {
    router.push("/new-recipe");
  }, [router]);

  const handleExploreRecipes = useCallback(() => {
    router.push("/(tabs)");
  }, [router]);

  const { recipes = [] } = data || {};
  const mappedRecipes = useMemo(() => recipes.map(mapToRecipe), [recipes, mapToRecipe]);
  const headerTopPadding = insets.top + 60;

  // Empty state props based on collection type
  const isExtracted = collectionSlug === "extracted";
  const emptyStateProps = {
    icon: isExtracted ? SquaresFourIcon : BookmarkIcon,
    iconColor: isExtracted ? "#334d43" : "#c65d47",
    iconShadowColor: isExtracted ? "#334d43" : "#c65d47",
    title: isExtracted ? t("library.extracted.empty.title") : t("library.saved.empty.title"),
    message: isExtracted ? t("library.extracted.empty.message") : t("library.saved.empty.message"),
    ctaLabel: isExtracted ? t("library.extracted.empty.cta") : t("library.saved.empty.cta"),
    ctaIcon: isExtracted ? Plus : MagnifyingGlass,
    onCtaPress: isExtracted ? handleExtractRecipe : handleExploreRecipes,
  };

  return (
    <View className="flex-1 bg-surface">
      <Animated.View entering={FadeIn.duration(300)} className="flex-1">
        {isLoading ? (
          <CollectionLoadingSkeleton topPadding={headerTopPadding} />
        ) : error ? (
          <CollectionErrorState errorMessage={error.message} onRetry={handleRefresh} />
        ) : (
          <MasonryGrid
            recipes={mappedRecipes}
            refreshing={isRefetching}
            onRefresh={handleRefresh}
            ListEmptyComponent={<CollectionEmptyState {...emptyStateProps} />}
            ListHeaderComponent={
              <PageHeader
                subtitle={collectionSubtitle}
                title={collectionTitle}
                topPadding={headerTopPadding}
              />
            }
            onScroll={scrollHandler}
            contentContainerStyle={{ paddingBottom: 100 }}
          />
        )}
      </Animated.View>

      <UnifiedStickyHeader title={collectionTitle} scrollY={scrollY} onBackPress={handleBack} />
    </View>
  );
}
