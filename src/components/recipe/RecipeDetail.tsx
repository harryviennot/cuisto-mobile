/**
 * Refactored Recipe detail component with better architecture
 * Uses split components for better maintainability and performance
 */
import React, { useState, useEffect, memo } from "react";
import { View, ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, {
  useAnimatedScrollHandler,
  useSharedValue,
  interpolate,
  useAnimatedStyle,
  withTiming
} from "react-native-reanimated";
import { useDeviceType } from "@/hooks/useDeviceType";
import { useAuth } from "@/contexts/AuthContext";

import type { Recipe } from "@/types/recipe";
import { AnimatedPageHeader } from "@/components/ui/AnimatedPageHeader";
import { Skeleton } from "@/components/ui/Skeleton";
import { ErrorState } from "@/components/ui/ErrorState";

// Import recipe components using barrel exports
import { CookingMode } from "@/components/recipe/CookingMode";
import {
  RecipeHeader,
  RecipeMetadata,
  RecipeContent,
  RecipeEditManager
} from "@/components/recipe/detail";

interface RecipeDetailProps {
  recipe?: Recipe;
  onBack?: () => void;
  isDraft?: boolean;
  isEditing?: boolean;
  onSave?: () => void;
  onDiscard?: () => void;
  isLoading?: boolean;
  error?: Error | null;
  onRetry?: () => void;
  showHeader?: boolean;
  // Optimistic props for immediate display
  optimisticTitle?: string;
  optimisticImageUrl?: string;
}

export const RecipeDetail = memo<RecipeDetailProps>(function RecipeDetail({
  recipe,
  onBack = () => { },
  isDraft = false,
  isEditing = false,
  onSave,
  onDiscard,
  isLoading = false,
  error = null,
  onRetry,
  showHeader = true,
  optimisticTitle,
  optimisticImageUrl,
}: RecipeDetailProps) {
  // All hooks MUST be called before any conditional returns
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const { isTablet, isTabletLandscape } = useDeviceType(isEditing);

  // State
  const [isCooking, setIsCooking] = useState(false);
  const [imageHeight, setImageHeight] = useState(0);
  const [titleLayout, setTitleLayout] = useState({ y: 0, height: 0 });

  // Animation values
  const scrollY = useSharedValue(0);
  const transitionProgress = useSharedValue(0);

  // Animation handlers - MUST be called before any conditional returns
  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
    },
  });

  const detailAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { scale: interpolate(transitionProgress.value, [0, 1], [1, 0.9]) },
      ],
      opacity: interpolate(transitionProgress.value, [0, 1], [1, 0]),
      borderRadius: interpolate(transitionProgress.value, [0, 1], [0, 20]),
      overflow: 'hidden',
    };
  });

  const cookingModeStyle = useAnimatedStyle(() => {
    return {
      opacity: interpolate(transitionProgress.value, [0, 0.3, 1], [0, 0, 1]),
      transform: [
        { scale: interpolate(transitionProgress.value, [0, 1], [1.1, 1]) },
      ],
      pointerEvents: isCooking ? 'auto' : 'none',
    };
  });

  // Effects
  useEffect(() => {
    transitionProgress.value = withTiming(isCooking ? 1 : 0, { duration: 800 });
  }, [isCooking]);

  useEffect(() => {
    scrollY.value = 0;
  }, []);

  useEffect(() => {
    if (isTabletLandscape) {
      scrollY.value = 0;
    }
  }, [isTabletLandscape]);

  // Handle error state
  if (error) {
    return (
      <View className="flex-1 bg-surface">
        {showHeader && (
          <AnimatedPageHeader
            title=""
            scrollY={scrollY}
            onBackPress={onBack}
            animationConfig={{
              scrollThresholdStart: 200,
              scrollThresholdEnd: 244,
              titleTranslateYStart: 16,
              titleTranslateYEnd: 0,
            }}
          />
        )}
        <ErrorState
          title="Failed to load recipe"
          message={error.message || "We couldn't load this recipe. Please try again."}
          onRetry={onRetry}
        />
      </View>
    );
  }



  // If we don't have a recipe but have optimistic data, create a minimal recipe object
  const displayRecipe = recipe || (optimisticTitle || optimisticImageUrl ? {
    id: '',
    title: optimisticTitle || '',
    image_url: optimisticImageUrl || '',
    created_by: '',
    rating_count: 0,
    ingredients: [],
    instructions: [],
    created_at: '',
    updated_at: '',
  } as Recipe : undefined);

  // If still no recipe data at all, return null
  if (!displayRecipe) {
    return null;
  }

  // Check ownership
  const isOwner = user?.id === displayRecipe.created_by;

  // Calculate scroll thresholds for header animation
  const titleAbsoluteY = imageHeight - insets.top - 12;
  const scrollThresholdStart = titleAbsoluteY > 0 ? titleAbsoluteY : 200;
  const calculatedEnd = titleAbsoluteY > 0 ? titleAbsoluteY + titleLayout.height : 244;
  const scrollThresholdEnd = Math.max(calculatedEnd, scrollThresholdStart + 50);

  // Render the left column (header and metadata)
  const renderLeftColumn = () => {
    const ContentWrapper = isTabletLandscape ? View : ScrollView;
    const contentWrapperProps = isTabletLandscape
      ? { className: "flex-1" }
      : {
        showsVerticalScrollIndicator: false,
        className: "flex-1",
        contentContainerStyle: { paddingBottom: 0 },
      };

    return (
      <View
        className={`${isTabletLandscape ? "w-[45%] border-r border-border-light bg-surface" : "w-full"
          } ${isTabletLandscape ? "" : "flex-1"}`}
      >
        <ContentWrapper {...contentWrapperProps}>
          <RecipeHeader
            recipe={displayRecipe}
            isLoading={isLoading}
            isDraft={isDraft}
            isEditing={isEditing}
            onImageHeightChange={setImageHeight}
            onTitleLayout={setTitleLayout}
          />

          {/* Only show metadata if we have full recipe data, otherwise show skeleton */}
          {recipe ? (
            <>
              {/* Only show RecipeEditManager wrapper for non-drafts */}
              {!isDraft && !isEditing ? (
                <RecipeEditManager recipe={recipe}>
                  {({
                    userRating,
                    displayPrepTime,
                    displayCookTime,
                    handleRatingChange,
                    handleOpenTimeEdit,
                    isTimeEditVisible,
                    setIsTimeEditVisible,
                  }) => (
                    <View className={`${isTablet ? "px-10 pb-8" : "px-4 pb-8"}`}>
                      <RecipeMetadata
                        recipe={recipe}
                        userRating={userRating}
                        isOwner={isOwner}
                        isDraft={isDraft}
                        isEditing={isEditing}
                        totalTime={displayPrepTime + displayCookTime}
                        onRatingChange={handleRatingChange}
                        onTimePress={handleOpenTimeEdit}
                        onSave={onSave}
                        onDiscard={onDiscard}
                        onStartCooking={() => setIsCooking(true)}
                      />
                    </View>
                  )}
                </RecipeEditManager>
              ) : (
                <View className={`${isTablet ? "px-10 pb-8" : "px-4 pb-8"}`}>
                  <RecipeMetadata
                    recipe={recipe}
                    userRating={0}
                    isOwner={isOwner}
                    isDraft={isDraft}
                    isEditing={isEditing}
                    totalTime={(recipe.timings?.prep_time_minutes ?? 0) + (recipe.timings?.cook_time_minutes ?? 0)}
                    onRatingChange={() => { }}
                    onTimePress={() => { }}
                    onSave={onSave}
                    onDiscard={onDiscard}
                    onStartCooking={() => setIsCooking(true)}
                  />
                </View>
              )}
            </>
          ) : (
            <View className={`${isTablet ? "px-10 pb-8" : "px-4 pb-8"}`}>
              <Skeleton width="100%" height={16} borderRadius={4} style={{ marginBottom: 4 }} />
              <Skeleton width="100%" height={16} borderRadius={4} style={{ marginBottom: 4 }} />
              <Skeleton width="65%" height={16} borderRadius={4} style={{ marginBottom: 24 }} />
              <View className="flex-row justify-between">
                <View className="flex-1">
                  <Skeleton width="50%" height={16} borderRadius={4} style={{ marginBottom: 8 }} />
                  <Skeleton width="90%" height={40} borderRadius={4} style={{ marginBottom: 4 }} />
                </View>
                <View className="flex-1 items-end">
                  <Skeleton width="50%" height={16} borderRadius={4} style={{ marginBottom: 8 }} />
                  <Skeleton width="65%" height={40} borderRadius={4} style={{ marginBottom: 4 }} />
                </View>
              </View>
              <Skeleton width="100%" height={64} borderRadius={4} style={{ marginBottom: 4, marginTop: 24 }} />
              <View className="flex-row gap-4 my-4">
                <Skeleton height={24} borderRadius={16} width={100} />
                <Skeleton height={24} borderRadius={16} width={100} />
                <Skeleton height={24} borderRadius={16} width={100} />
                <Skeleton height={24} borderRadius={16} width={100} />
              </View>
              {!isTabletLandscape && (
                <>
                  <Skeleton width="45%" height={32} borderRadius={4} style={{ marginBottom: 4, marginTop: 24 }} />
                  <Skeleton width="85%" height={20} borderRadius={4} style={{ marginBottom: 4, marginTop: 8 }} />
                </>
              )}



            </View>
          )}
        </ContentWrapper>
      </View>
    );
  };

  // Main render
  return (
    <View className="flex-1 bg-black">
      <Animated.View className="flex-1 bg-surface" style={detailAnimatedStyle}>
        {showHeader && (
          <AnimatedPageHeader
            title={displayRecipe.title}
            scrollY={scrollY}
            onBackPress={!isDraft ? onBack : undefined}
            onMenuPress={!isDraft ? () => { } : undefined}
            animationConfig={{
              scrollThresholdStart,
              scrollThresholdEnd,
              titleTranslateYStart: 16,
              titleTranslateYEnd: 0,
            }}
          />
        )}

        {isTabletLandscape ? (
          <View className="flex-1 flex-row">
            {renderLeftColumn()}
            {recipe && <RecipeContent recipe={recipe} isTabletLandscape={true} />}
          </View>
        ) : (
          <Animated.ScrollView showsVerticalScrollIndicator={false} onScroll={scrollHandler}>
            {renderLeftColumn()}
            {recipe && <RecipeContent recipe={recipe} isTabletLandscape={false} />}
          </Animated.ScrollView>
        )}
      </Animated.View>

      {/* Cooking Mode Overlay */}
      {isCooking && recipe && (
        <Animated.View
          style={[
            { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
            cookingModeStyle,
          ]}
        >
          <CookingMode recipe={recipe} onClose={() => setIsCooking(false)} />
        </Animated.View>
      )}
    </View>
  );
});