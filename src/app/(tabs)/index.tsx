import { useTranslation } from "react-i18next";
import { View, Text, ActivityIndicator, Pressable, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useCallback } from "react";
import { PlusIcon, WarningIcon } from "phosphor-react-native";
import { useQueryClient } from "@tanstack/react-query";
import { router } from "expo-router";
import { BlurView } from "expo-blur";
import Animated, {
  useAnimatedScrollHandler,
  useSharedValue,
  useAnimatedStyle,
} from "react-native-reanimated";
import { SearchButton } from "@/components/home/SearchButton";
import { MasonryGrid } from "@/components/home/MasonryGrid";
import { useRecipes } from "@/hooks/useRecipes";
import { useAuth } from "@/contexts/AuthContext";

// Header height for scroll calculations
const HEADER_CONTENT_HEIGHT = 120;

export default function Index() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const { isAuthenticated } = useAuth();

  // Scroll tracking for header animation
  const scrollY = useSharedValue(0);
  const lastScrollY = useSharedValue(0);
  const headerTranslateY = useSharedValue(0);

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

  // Scroll handler for header hide/show
  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      const currentY = event.contentOffset.y;
      const diff = currentY - lastScrollY.value;

      // Only start hiding after scrolling past the header
      if (currentY > HEADER_CONTENT_HEIGHT) {
        // Scrolling down - hide header
        if (diff > 0) {
          headerTranslateY.value = Math.max(
            headerTranslateY.value - diff,
            -(HEADER_CONTENT_HEIGHT + insets.top)
          );
        }
        // Scrolling up - show header
        else if (diff < 0) {
          headerTranslateY.value = Math.min(headerTranslateY.value - diff, 0);
        }
      } else {
        // Near top - always show header
        headerTranslateY.value = 0;
      }

      lastScrollY.value = currentY;
      scrollY.value = currentY;
    },
  });

  // Animated style for the header
  const headerAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateY: headerTranslateY.value }],
    };
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

  const totalHeaderHeight = HEADER_CONTENT_HEIGHT + insets.top;

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
        onScroll={scrollHandler}
        contentContainerStyle={{
          paddingTop: totalHeaderHeight,
          paddingBottom: 100,
        }}
      />

      {/* Animated Sticky Header */}
      <Animated.View
        style={[styles.headerContainer, { paddingTop: insets.top }, headerAnimatedStyle]}
        pointerEvents="box-none"
      >
        <BlurView
          intensity={80}
          tint="light"
          style={[styles.headerBlur, { paddingTop: insets.top }]}
        >
          <View style={styles.headerContent}>
            <Text
              className="text-5xl font-playfair-bold leading-tight text-foreground-heading mb-4"
              style={{
                fontFamily: "PlayfairDisplay_500Medium",
                textShadowColor: "rgba(0, 0, 0, 0.03)",
                textShadowOffset: { width: 1, height: 1 },
                textShadowRadius: 1,
              }}
            >
              My Recipes
            </Text>
            <SearchButton
              onPress={handleSearchPress}
              placeholder={t("search.placeholder", "Search recipes...")}
            />
          </View>
        </BlurView>
      </Animated.View>

      {/* Always-visible BlurView for safe area - stays on top even when header hides */}
      <BlurView
        intensity={50}
        tint="light"
        style={[styles.safeAreaBlur, { height: insets.top }]}
        pointerEvents="none"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 5,
  },
  headerBlur: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  headerContent: {
    // Content styling
  },
  safeAreaBlur: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
});
