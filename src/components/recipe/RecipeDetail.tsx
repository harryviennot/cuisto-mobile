/**
 * Refactored Recipe detail component with better architecture
 * Uses split components for better maintainability and performance
 */
import React, { useState, useEffect, memo } from "react";
import { View, ScrollView, Alert, TouchableOpacity, ActivityIndicator, Text } from "react-native";
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
  TranslateIcon,
  ArrowUUpLeftIcon,
} from "phosphor-react-native";
import * as Haptics from "expo-haptics";
import { useDeviceType } from "@/hooks/useDeviceType";
import { useAuth } from "@/contexts/AuthContext";
import { useDeleteRecipe } from "@/hooks/useRecipes";
import { useToggleFavorite } from "@/hooks/useCollections";
import { translationService, recipeService } from "@/api/services";
import i18n from "@/locales/i18n";

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

  // Translation state - cache both versions for instant switching
  const [cachedOriginal, setCachedOriginal] = useState<Recipe | null>(null);
  const [cachedTranslated, setCachedTranslated] = useState<Recipe | null>(null);
  const [isTranslating, setIsTranslating] = useState(false);
  const [isViewingTranslation, setIsViewingTranslation] = useState(false);

  // Computed displayed recipe from cache
  const displayedRecipe = isViewingTranslation ? cachedTranslated : cachedOriginal;

  // Current user locale (normalize to 2-letter code, e.g., "en-US" -> "en")
  const userLocale = i18n.language?.split("-")[0] || "en";

  // Determine if translation is available
  // Recipe's original language (from the language field)
  const recipeOriginalLanguage = recipe?.language?.split("-")[0];
  // Check if the recipe content is different from user's locale
  const recipeNeedsTranslation = recipe && recipeOriginalLanguage && recipeOriginalLanguage !== userLocale;
  // Check if the recipe is already being displayed as translated (from backend's is_translated field or local state)
  const isAlreadyTranslated = recipe?.is_translated === true || isViewingTranslation;

  // Debug logging for translation
  console.log("[RecipeDetail] Translation check:", {
    recipeOriginalLanguage,
    userLocale,
    recipeNeedsTranslation,
    isAlreadyTranslated,
    backendIsTranslated: recipe?.is_translated,
    localIsViewingTranslation: isViewingTranslation,
  });

  // Get language display name
  const getLanguageName = (code: string): string => {
    return t(`language.names.${code}`, { defaultValue: code.toUpperCase() });
  };

  // Sync cache with recipe prop changes
  useEffect(() => {
    if (recipe) {
      // If recipe comes in already translated (auto-translate ON), cache as translated
      if (recipe.is_translated) {
        setCachedTranslated(recipe);
        setIsViewingTranslation(true);
        // Don't clear original cache - user might have it from previous view
      } else {
        setCachedOriginal(recipe);
        setIsViewingTranslation(false);
        // Don't clear translated cache - user might have it from previous view
      }
    }
  }, [recipe]);

  // Handle translate to user's language
  const handleTranslate = async () => {
    if (!recipe) return;

    setIsActionsModalVisible(false);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    // Check cache first - instant switch if already fetched
    if (cachedTranslated) {
      setIsViewingTranslation(true);
      return;
    }

    // Fetch and cache translation
    setIsTranslating(true);

    try {
      const translated = await translationService.translateRecipe(recipe.id, userLocale);
      setCachedTranslated(translated);
      setIsViewingTranslation(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      console.error("Failed to translate recipe:", error);
      Alert.alert(t("common.error"), t("discovery.error.message"));
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setIsTranslating(false);
    }
  };

  // Handle view original - fetch the original recipe without translation
  const handleViewOriginal = async () => {
    if (!recipe) return;

    setIsActionsModalVisible(false);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    // Check cache first - instant switch if already fetched
    if (cachedOriginal) {
      setIsViewingTranslation(false);
      return;
    }

    // Fetch and cache original
    setIsTranslating(true); // Reuse loading state

    try {
      const original = await recipeService.getRecipe(recipe.id);
      setCachedOriginal(original);
      setIsViewingTranslation(false);
    } catch (error) {
      console.error("Failed to fetch original recipe:", error);
      Alert.alert(t("common.error"), t("discovery.error.message"));
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setIsTranslating(false);
    }
  };

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
  const baseRecipe =
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
  if (!baseRecipe) {
    return null;
  }

  // Use translated recipe if available, otherwise use base recipe
  const displayRecipe = displayedRecipe || baseRecipe;

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
        className={`${
          isTabletLandscape ? "w-[45%] border-r border-border-light bg-surface" : "w-full"
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
                    totalTime={
                      (recipe.timings?.prep_time_minutes ?? 0) +
                      (recipe.timings?.cook_time_minutes ?? 0)
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

  // Main render
  return (
    <View className="flex-1 bg-black">
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
            {displayRecipe && <RecipeContent recipe={displayRecipe} isTabletLandscape={true} />}
          </View>
        ) : (
          <Animated.ScrollView showsVerticalScrollIndicator={false} onScroll={scrollHandler}>
            {renderLeftColumn()}
            {displayRecipe && <RecipeContent recipe={displayRecipe} isTabletLandscape={false} />}
          </Animated.ScrollView>
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

      {/* Translation Loading Overlay */}
      {isTranslating && (
        <View
          className="absolute inset-0 bg-black/50 items-center justify-center z-50"
          style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
        >
          <View className="bg-surface rounded-2xl p-6 items-center shadow-lg">
            <ActivityIndicator size="large" color="#334d43" />
            <Text className="text-foreground mt-3 font-medium">
              {t("recipe.actions.translating")}
            </Text>
          </View>
        </View>
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
          // Translation action: Show "Translate" or "View Original" based on state
          ...(recipeNeedsTranslation
            ? [
                isAlreadyTranslated
                  ? {
                      label: t("recipe.actions.viewOriginal"),
                      description: t("recipe.actions.viewOriginalDescription"),
                      icon: <ArrowUUpLeftIcon size={24} color="#334d43" />,
                      onPress: handleViewOriginal,
                    }
                  : {
                      label: t("recipe.actions.translate", { language: getLanguageName(userLocale) }),
                      description: t("recipe.actions.translateDescription"),
                      icon: <TranslateIcon size={24} color="#334d43" />,
                      onPress: handleTranslate,
                    },
              ]
            : []),
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
