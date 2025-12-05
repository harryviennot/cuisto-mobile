/**
 * Collection Detail Screen
 *
 * Displays recipes within a collection with:
 * - Masonry grid layout (Pinterest-style)
 * - Sticky header that hides on scroll down, shows on scroll up
 * - Pull-to-refresh
 * - Skeleton loading
 * - Empty states with CTAs based on collection type
 */
import React, { useMemo, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Pressable,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ArrowLeft, Package, SquaresFourIcon, Plus, MagnifyingGlass, BookmarkIcon } from "phosphor-react-native";
import Animated, {
  FadeIn,
  FadeInDown,
  useSharedValue,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useAnimatedProps,
  interpolate,
  Extrapolation,
} from "react-native-reanimated";
import { useTranslation } from "react-i18next";
import Toast from "react-native-toast-message";
import { BlurView } from "expo-blur";

import { useCollectionBySlug } from "@/hooks/useCollections";
import { RecipeCardSkeleton } from "@/components/recipe";
import { MasonryGrid } from "@/components/home/MasonryGrid";
import type { CollectionRecipe } from "@/types/collection";
import type { Recipe } from "@/types/recipe";

// Collection slug to icon mapping
const COLLECTION_ICONS: Record<string, React.ComponentType<{ size: number; color: string; weight: "duotone" }>> = {
  extracted: SquaresFourIcon,
  saved: BookmarkIcon,
};

// Collection display names
const COLLECTION_NAMES: Record<string, string> = {
  extracted: "All Recipes",
  saved: "Favorites",
};

const AnimatedBlurView = Animated.createAnimatedComponent(BlurView);

export default function CollectionDetailScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  // The route param is [id] but we now pass slug values directly
  const { id: slug } = useLocalSearchParams<{ id: string }>();

  // Fetch collection by slug
  const { data, isLoading, error, refetch, isRefetching } = useCollectionBySlug(slug || "");

  const handleBack = () => router.back();

  // Convert CollectionRecipe to Recipe format for RecipeCard
  const mapToRecipe = useCallback((cr: CollectionRecipe): Recipe => ({
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
  }), []);

  // Determine collection type from data or params
  const collectionSlug = data?.collection?.slug || slug || "extracted";
  const Icon = COLLECTION_ICONS[collectionSlug] || Package;

  // Handle pull-to-refresh
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

  // Navigate to extract recipe
  const handleExtractRecipe = useCallback(() => {
    router.push("/new-recipe");
  }, [router]);

  // Navigate to explore (home for now)
  const handleExploreRecipes = useCallback(() => {
    router.push("/(tabs)");
  }, [router]);

  // Render skeleton grid
  const renderSkeletons = useMemo(() => (
    <View className="flex-row flex-wrap justify-between px-4">
      {[1, 2, 3, 4].map((i) => (
        <View key={i} style={{ width: "48%" }}>
          <RecipeCardSkeleton height={i % 2 === 0 ? 200 : 240} />
        </View>
      ))}
    </View>
  ), []);

  // Render empty state based on collection type
  const renderEmptyState = useCallback(() => {
    const isExtracted = collectionSlug === "extracted";

    return (
      <Animated.View
        entering={FadeInDown.delay(200).duration(400)}
        className="flex-1 items-center justify-center px-8"
      >
        {/* Icon */}
        <View
          className="w-20 h-20 rounded-full items-center justify-center mb-6"
          style={{ backgroundColor: isExtracted ? "#334d4315" : "#c65d4715" }}
        >
          <Icon
            size={40}
            color={isExtracted ? "#334d43" : "#c65d47"}
            weight="duotone"
          />
        </View>

        {/* Title */}
        <Text className=" text-xl text-foreground-heading text-center mb-2">
          {isExtracted
            ? t("library.extracted.empty.title")
            : t("library.saved.empty.title")}
        </Text>

        {/* Message */}
        <Text className="text-foreground-muted text-center mb-8 leading-5">
          {isExtracted
            ? t("library.extracted.empty.message")
            : t("library.saved.empty.message")}
        </Text>

        {/* CTA Button */}
        <Pressable
          onPress={isExtracted ? handleExtractRecipe : handleExploreRecipes}
          className="flex-row items-center gap-2 bg-primary px-6 py-3.5 rounded-full active:opacity-90"
          style={{
            shadowColor: "#334d43",
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.2,
            shadowRadius: 8,
            elevation: 4,
          }}
        >
          {isExtracted ? (
            <Plus size={18} color="#ffffff" weight="bold" />
          ) : (
            <MagnifyingGlass size={18} color="#ffffff" weight="bold" />
          )}
          <Text className="text-white font-semibold">
            {isExtracted
              ? t("library.extracted.empty.cta")
              : t("library.saved.empty.cta")}
          </Text>
        </Pressable>
      </Animated.View>
    );
  }, [collectionSlug, t, handleExtractRecipe, handleExploreRecipes, Icon]);

  // Render error state (but still show header)
  const renderErrorState = useCallback(() => (
    <View className="flex-1 items-center justify-center px-8">
      <Text className="font-playfair-bold text-xl text-foreground-heading text-center">
        {t("library.error.title")}
      </Text>
      <Text className="text-foreground-muted text-center mt-2 mb-6">
        {error?.message || t("common.tryAgain")}
      </Text>
      <Pressable
        onPress={handleRefresh}
        className="bg-primary px-6 py-3 rounded-full active:opacity-90"
      >
        <Text className="text-white font-semibold">{t("common.retry")}</Text>
      </Pressable>
    </View>
  ), [t, error, handleRefresh]);

  // Scroll handler
  const scrollY = useSharedValue(0);
  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
    },
  });

  const { collection, recipes = [] } = data || {};
  const displayName = collection?.name || COLLECTION_NAMES[slug || ""] || t("library.collections.allRecipes");

  // Convert CollectionRecipe[] to Recipe[] for MasonryGrid
  const mappedRecipes = useMemo(
    () => recipes.map(mapToRecipe),
    [recipes, mapToRecipe]
  );

  // Large Header (Scrolls with content)
  const ListHeaderComponent = useMemo(() => (
    <View
      style={{
        paddingTop: insets.top + 60, // Space for sticky header + extra
        paddingHorizontal: 20,
        paddingBottom: 24,
      }}
    >
      <Text className="text-[10px] font-bold uppercase tracking-[0.2em] text-foreground-tertiary mb-3">
        {collectionSlug === "extracted" ? t("library.subtitle") : t("library.collections.favorites").toUpperCase()}
      </Text>
      <Text
        className="font-playfair-bold text-4xl text-foreground-heading leading-[1.1]"
      >
        {displayName}
      </Text>
    </View>
  ), [insets.top, displayName, collectionSlug, t]);

  // Animated styles for sticky header
  const headerBackgroundStyle = useAnimatedStyle(() => {
    return {
      opacity: interpolate(scrollY.value, [0, 100], [0, 1], Extrapolation.CLAMP),
    };
  });

  const headerBlurProps = useAnimatedProps(() => {
    return {
      intensity: interpolate(scrollY.value, [0, 100], [0, 90], Extrapolation.CLAMP),
    };
  });

  const headerTitleStyle = useAnimatedStyle(() => {
    return {
      opacity: interpolate(scrollY.value, [60, 120], [0, 1], Extrapolation.CLAMP),
      transform: [
        {
          translateY: interpolate(scrollY.value, [60, 120], [20, 0], Extrapolation.CLAMP),
        },
      ],
    };
  });

  const backButtonStyle = useAnimatedStyle(() => {
    // Optional: Morph back button or just keep it
    return {};
  });

  return (
    <View className="flex-1 bg-surface">
      <Animated.View entering={FadeIn.duration(300)} className="flex-1">
        {/* Content */}
        {isLoading ? (
          // Loading skeleton with header
          <View style={{ paddingTop: insets.top + 60 }}>
            {renderSkeletons}
          </View>
        ) : error ? (
          // Error state
          renderErrorState()
        ) : (
          <MasonryGrid
            recipes={mappedRecipes}
            refreshing={isRefetching}
            onRefresh={handleRefresh}
            ListEmptyComponent={renderEmptyState()}
            ListHeaderComponent={ListHeaderComponent}
            onScroll={scrollHandler}
            refreshControlOffset={insets.top + 60}
            contentContainerStyle={{
              paddingBottom: 100,
            }}
          />
        )}
      </Animated.View>

      {/* Sticky Header */}
      <View
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 100,
        }}
      >
        {/* Animated Background Container (Blur + Color) */}
        <Animated.View
          style={[
            headerBackgroundStyle,
            {
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
            },
          ]}
        >
          {/* Layer 1: Progressive Blur */}
          <AnimatedBlurView
            tint="light"
            animatedProps={headerBlurProps}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
            }}
          />

          {/* Layer 2: Color Overlay */}
          <View
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(244, 241, 232, 0.5)',
            }}
          />

          {/* Layer 3: Border */}
          <View
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              bottom: 0,
              height: 1,
              backgroundColor: 'rgba(0,0,0,0.05)',
            }}
          />
        </Animated.View>

        {/* Header Content (Overlay) */}
        <View
          style={{
            paddingTop: insets.top,
            paddingHorizontal: 16,
            paddingBottom: 12,
            flexDirection: 'row',
            alignItems: 'center',
          }}
        >
          <TouchableOpacity
            onPress={handleBack}
            className="w-10 h-10 rounded-full  items-center justify-center z-20"
            activeOpacity={0.7}
            style={{
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.1,
              shadowRadius: 4,
              elevation: 3,
            }}
          >
            <ArrowLeft size={24} color="#334d43" weight="bold" />
          </TouchableOpacity>

          <Animated.View
            style={[
              headerTitleStyle,
              {
                flex: 1,
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: 40, // Balance the back button
              }
            ]}
            pointerEvents="none"
          >
            <Text
              className="text-xl text-foreground-heading"
              numberOfLines={1}
            >
              {displayName}
            </Text>
          </Animated.View>
        </View>
      </View>
    </View>
  );
}
