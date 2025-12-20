/**
 * Refactored Recipe detail component with better architecture
 * Uses split components for better maintainability and performance
 */
import React, { useState, useEffect, memo } from "react";
import { View, Alert, TouchableOpacity } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, {
  useAnimatedScrollHandler,
  useSharedValue,
  interpolate,
  useAnimatedStyle,
  withTiming,
} from "react-native-reanimated";
import {
  ShareNetworkIcon,
  PencilIcon,
  TrashIcon,
  Bookmark,
  DotsThreeIcon,
} from "phosphor-react-native";
import * as Haptics from "expo-haptics";
import { useDeviceType } from "@/hooks/useDeviceType";
import { useAuth } from "@/contexts/AuthContext";
import { useDeleteRecipe } from "@/hooks/useRecipes";
import { useToggleFavorite } from "@/hooks/useCollections";

import type { Recipe } from "@/types/recipe";
import { UnifiedStickyHeader } from "@/components/ui/UnifiedStickyHeader";
import { Skeleton } from "@/components/ui/Skeleton";
import { ErrorState } from "@/components/ui/ErrorState";
import { ActionSheet } from "@/components/ui/ActionSheet";

// Import recipe components using barrel exports
import { CookingMode } from "@/components/recipe/CookingMode";
import { CookingSessionProvider } from "@/contexts/CookingSessionContext";
import {
  RecipeHeader,
  RecipeTitle,
  RecipeMetadata,
  RecipeContent,
  RecipeEditManager,
} from "@/components/recipe/detail";
import { t } from "i18next";
import { router } from "expo-router";

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
  onBack = () => {},
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
  const deleteRecipeMutation = useDeleteRecipe();
  const { mutate: toggleFavorite } = useToggleFavorite();

  // Get favorite status from user_data
  const isFavorite = recipe?.user_data?.is_favorite ?? false;

  // State
  const [isCooking, setIsCooking] = useState(false);
  const [imageHeight, setImageHeight] = useState(0);
  const [titleLayout, setTitleLayout] = useState({ y: 0, height: 0 });

  const [isActionsModalVisible, setIsActionsModalVisible] = useState(false);

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
      transform: [{ scale: interpolate(transitionProgress.value, [0, 1], [1, 0.9]) }],
      opacity: interpolate(transitionProgress.value, [0, 1], [1, 0]),
      borderRadius: interpolate(transitionProgress.value, [0, 1], [0, 20]),
      overflow: "hidden",
    };
  });

  const cookingModeStyle = useAnimatedStyle(() => {
    return {
      opacity: interpolate(transitionProgress.value, [0, 0.3, 1], [0, 0, 1]),
      transform: [{ scale: interpolate(transitionProgress.value, [0, 1], [1.1, 1]) }],
      pointerEvents: isCooking ? "auto" : "none",
    };
  });

  // Effects
  useEffect(() => {
    transitionProgress.value = withTiming(isCooking ? 1 : 0, { duration: 800 });
  }, [isCooking, transitionProgress]);

  useEffect(() => {
    scrollY.value = 0;
  }, [scrollY]);

  useEffect(() => {
    if (isTabletLandscape) {
      scrollY.value = 0;
    }
  }, [isTabletLandscape, scrollY]);

  // Handle error state
  if (error) {
    return (
      <View className="flex-1 bg-surface">
        {showHeader && (
          <UnifiedStickyHeader
            scrollY={scrollY}
            onBackPress={onBack}
            scrollThresholdStart={0}
            scrollThresholdEnd={100}
          />
        )}
        <ErrorState
          title={t("recipe.failedToLoad")}
          message={error.message || t("recipe.failedToLoad")}
          onRetry={onRetry}
        />
      </View>
    );
  }

  // If we don't have a recipe but have optimistic data, create a minimal recipe object
  const displayRecipe =
    recipe ||
    (optimisticTitle || optimisticImageUrl
      ? ({
          id: "",
          title: optimisticTitle || "",
          image_url: optimisticImageUrl || "",
          created_by: "",
          rating_count: 0,
          total_times_cooked: 0,
          ingredients: [],
          instructions: [],
          created_at: "",
          updated_at: "",
        } as Recipe)
      : undefined);

  // If still no recipe data at all, return null
  if (!displayRecipe) {
    return null;
  }

  // Check ownership
  const isOwner = user?.id === displayRecipe.created_by;

  // Handle delete with confirmation
  const handleDelete = () => {
    Alert.alert(t("recipe.errors.deleteTitle"), t("recipe.errors.deleteConfirmation"), [
      {
        text: t("common.cancel"),
        style: "cancel",
      },
      {
        text: t("common.delete"),
        style: "destructive",
        onPress: () => {
          if (recipe) {
            deleteRecipeMutation.mutate(recipe.id, {
              onSuccess: () => {
                router.back();
              },
            });
          }
        },
      },
    ]);
  };

  // Calculate scroll thresholds for header animation
  const titleAbsoluteY = imageHeight - insets.top - 12;
  const scrollThresholdStart = titleAbsoluteY > 0 ? titleAbsoluteY : 200;
  const calculatedEnd = titleAbsoluteY > 0 ? titleAbsoluteY + titleLayout.height : 244;
  const scrollThresholdEnd = Math.max(calculatedEnd, scrollThresholdStart + 50);

  // Render the left column (header and metadata)
  const renderLeftColumn = () => {
    // Use View for both cases to avoid nested ScrollView in portrait mode
    const ContentWrapper = View;
    const contentWrapperProps = isTabletLandscape
      ? { className: "flex-1" }
      : { className: "flex-1" };

    return (
      <View
        className={`${
          isTabletLandscape ? "w-[45%] border-r border-border-light bg-surface" : "w-full"
        } ${isTabletLandscape ? "" : "flex-1"}`}
      >
        <ContentWrapper {...contentWrapperProps}>
          {!isTabletLandscape && (
            <View style={{ height: imageHeight, width: "100%" }} pointerEvents="none" />
          )}

          {isTabletLandscape && (
            <RecipeHeader
              recipe={displayRecipe}
              isLoading={isLoading}
              isDraft={isDraft}
              isEditing={isEditing}
              onImageHeightChange={setImageHeight}
              scrollY={scrollY}
            />
          )}

          <RecipeTitle recipe={displayRecipe} onTitleLayout={setTitleLayout} />

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
                    displayRestingTime,
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
                        totalTime={displayPrepTime + displayCookTime + displayRestingTime}
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
                    totalTime={
                      (recipe.timings?.prep_time_minutes ?? 0) +
                      (recipe.timings?.cook_time_minutes ?? 0) +
                      (recipe.timings?.resting_time_minutes ?? 0)
                    }
                    onRatingChange={() => {}}
                    onTimePress={() => {}}
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
              <Skeleton
                width="100%"
                height={64}
                borderRadius={4}
                style={{ marginBottom: 4, marginTop: 24 }}
              />
              <View className="flex-row gap-4 my-4">
                <Skeleton height={24} borderRadius={16} width={100} />
                <Skeleton height={24} borderRadius={16} width={100} />
                <Skeleton height={24} borderRadius={16} width={100} />
                <Skeleton height={24} borderRadius={16} width={100} />
              </View>
              {!isTabletLandscape && (
                <>
                  <Skeleton
                    width="45%"
                    height={32}
                    borderRadius={4}
                    style={{ marginBottom: 4, marginTop: 24 }}
                  />
                  <Skeleton
                    width="85%"
                    height={20}
                    borderRadius={4}
                    style={{ marginBottom: 4, marginTop: 8 }}
                  />
                </>
              )}
            </View>
          )}
        </ContentWrapper>
      </View>
    );
  };

  console.log("recipe times: ", recipe?.timings);

  // Main render
  return (
    <View className="flex-1">
      <Animated.View className="flex-1 bg-surface" style={detailAnimatedStyle}>
        {showHeader && (
          <UnifiedStickyHeader
            title={displayRecipe.title}
            scrollY={scrollY}
            onBackPress={!isDraft ? onBack : undefined}
            scrollThresholdStart={scrollThresholdStart}
            scrollThresholdEnd={scrollThresholdEnd}
            showButtonBackdrop={true}
            rightElement={
              !isDraft ? (
                <TouchableOpacity
                  onPress={() => setIsActionsModalVisible(true)}
                  className="w-11 h-11 rounded-full items-center justify-center"
                  activeOpacity={0.7}
                >
                  <DotsThreeIcon size={24} color="#334d43" weight="bold" />
                </TouchableOpacity>
              ) : undefined
            }
            rightElementAlwaysVisible={true}
          />
        )}

        {isTabletLandscape ? (
          <View className="flex-1 flex-row">
            {renderLeftColumn()}
            {recipe && (
              <RecipeContent
                recipe={recipe}
                isTabletLandscape={true}
                isDraft={isDraft}
                isEditing={isEditing}
                onStartCooking={() => setIsCooking(true)}
              />
            )}
          </View>
        ) : (
          <View className="flex-1">
            <View
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
              }}
              pointerEvents="none"
            >
              <RecipeHeader
                recipe={displayRecipe}
                isLoading={isLoading}
                isDraft={isDraft}
                isEditing={isEditing}
                onImageHeightChange={setImageHeight}
                scrollY={scrollY}
              />
            </View>
            <Animated.ScrollView showsVerticalScrollIndicator={false} onScroll={scrollHandler}>
              {renderLeftColumn()}
              {recipe && (
                <RecipeContent
                  recipe={recipe}
                  isTabletLandscape={false}
                  isDraft={isDraft}
                  isEditing={isEditing}
                  onStartCooking={() => setIsCooking(true)}
                />
              )}
            </Animated.ScrollView>
          </View>
        )}
      </Animated.View>

      {/* Cooking Mode Overlay */}
      {isCooking && recipe && (
        <Animated.View
          style={[{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }, cookingModeStyle]}
        >
          <CookingSessionProvider>
            <CookingMode recipe={recipe} onClose={() => setIsCooking(false)} />
          </CookingSessionProvider>
        </Animated.View>
      )}
      {/* Actions Modal */}
      <ActionSheet
        visible={isActionsModalVisible}
        onClose={() => setIsActionsModalVisible(false)}
        actions={[
          {
            label: isFavorite ? t("recipe.bookmark.remove") : t("recipe.bookmark.save"),
            icon: <Bookmark size={24} color="#334d43" weight={isFavorite ? "fill" : "regular"} />,
            onPress: () => {
              if (recipe) {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                toggleFavorite({ recipeId: recipe.id, isFavorite });
              }
              setIsActionsModalVisible(false);
            },
          },
          {
            label: t("recipe.actions.share"),
            description: t("recipe.actions.shareDescription"),
            icon: <ShareNetworkIcon size={24} color="#334d43" />,
            onPress: () => {
              setIsActionsModalVisible(false);
            },
          },
          ...(isOwner
            ? [
                {
                  label: t("recipe.actions.edit"),
                  icon: <PencilIcon size={24} color="#334d43" />,
                  onPress: () => {
                    if (recipe) {
                      router.push(`/recipe/${recipe?.id}/edit`);
                      setIsActionsModalVisible(false);
                    }
                  },
                },
                {
                  label: t("recipe.actions.delete"),
                  description: t("recipe.actions.deleteDescription"),
                  icon: <TrashIcon size={24} color="#ef4444" />,
                  variant: "destructive" as const,
                  onPress: () => {
                    setIsActionsModalVisible(false);
                    handleDelete();
                  },
                },
              ]
            : []),
        ]}
      />
    </View>
  );
});
