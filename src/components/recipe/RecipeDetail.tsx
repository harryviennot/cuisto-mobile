/**
 * Recipe detail component with iPad landscape support
 * Displays recipe information in a two-column layout on tablets
 */
import React, { useState, useEffect } from "react";
import { View, Text, ScrollView, Image, Alert } from "react-native";
import Toast from "react-native-toast-message";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, { useAnimatedScrollHandler, useSharedValue } from "react-native-reanimated";
import { useTranslation } from "react-i18next";
import { useDeviceType } from "@/hooks/useDeviceType";
import { useAuth } from "@/contexts/AuthContext";
import { useUpdateRecipeRating, useUpdateRecipeTimings } from "@/hooks/useRecipes";
import { router } from "expo-router";

import type { Recipe } from "@/types/recipe";
import { CookingMode } from "./CookingMode";
import { RecipeRating } from "./RecipeRating";
import { RecipeActionButtons } from "./RecipeActionButtons";
import { RecipeQuickInfo } from "./RecipeQuickInfo";
import { RecipeTags } from "./RecipeTags";
import { AnimatedPageHeader } from "../AnimatedPageHeader";
import { RecipeIngredients } from "./RecipeIngredients";
import { RecipeInstructions } from "./RecipeInstructions";
import { EditCookTimeBottomSheet } from "./EditCookTimeBottomSheet";
import { ServingsSelector } from "./ServingsSelector";

interface RecipeDetailProps {
  recipe: Recipe;
  onBack?: () => void;
  isDraft?: boolean;
  isEditing?: boolean;
  onSave?: () => void;
  onDiscard?: () => void;
}

export const RecipeDetail: React.FC<RecipeDetailProps> = ({
  recipe,
  onBack = () => { },
  isDraft = false,
  isEditing = false,
  onSave,
  onDiscard,
}) => {
  const { t } = useTranslation();
  const scrollY = useSharedValue(0);
  const insets = useSafeAreaInsets();
  const { isTablet, isTabletLandscape } = useDeviceType(isEditing);
  const { user } = useAuth();
  const [servings, setServings] = useState(recipe.servings || 4);
  const [isCooking, setIsCooking] = useState(false);
  const [imageHeight, setImageHeight] = useState(0);
  const [titleLayout, setTitleLayout] = useState({ y: 0, height: 0 });

  // Mutations
  const updateRatingMutation = useUpdateRecipeRating();
  const updateTimingsMutation = useUpdateRecipeTimings();

  // Time editing state - use user custom times if available, fallback to base recipe
  const [isTimeEditVisible, setIsTimeEditVisible] = useState(false);
  const displayPrepTime =
    recipe.user_data?.custom_prep_time_minutes ?? recipe.timings?.prep_time_minutes ?? 0;
  const displayCookTime =
    recipe.user_data?.custom_cook_time_minutes ?? recipe.timings?.cook_time_minutes ?? 0;

  // Rating state - use user's personal rating if available
  const userRating = recipe.user_data?.rating ?? 0;
  const isOwner = user?.id === recipe.created_by;

  // Handlers for time editing
  const handleOpenTimeEdit = () => {
    setIsTimeEditVisible(true);
  };

  const handleSaveTimes = async (newPrepMinutes: number, newCookMinutes: number) => {
    try {
      await updateTimingsMutation.mutateAsync({
        recipeId: recipe.id,
        timings: {
          prep_time_minutes: newPrepMinutes,
          cook_time_minutes: newCookMinutes,
        },
      });

      setIsTimeEditVisible(false);
    } catch (error) {
      console.error("Failed to update timings:", error);
      Toast.show({
        type: "error",
        text1: t("common.error"),
        text2: t("recipe.errors.updateTimingFailed"),
      });
    }
  };

  // Handler for rating changes
  const handleRatingChange = async (rating: number) => {
    // Validate rating is in 0.5 increments
    if ((rating * 2) % 1 !== 0 || rating < 0.5 || rating > 5.0) {
      Toast.show({
        type: "error",
        text1: t("common.error"),
        text2: t("recipe.errors.invalidRatingFormat"),
      });
      return;
    }

    try {
      await updateRatingMutation.mutateAsync({
        recipeId: recipe.id,
        rating,
      });
    } catch (error) {
      Toast.show({
        type: "error",
        text1: t("common.error"),
        text2: t("recipe.errors.rateRecipeFailed"),
      });
    }
  };

  // Calculate total time
  const totalTime = displayPrepTime + displayCookTime;

  // Initialize scrollY to 0 on mount to prevent inverted animation
  useEffect(() => {
    scrollY.value = 0;
  }, []);

  // Reset scrollY when switching to landscape mode to hide the header
  useEffect(() => {
    if (isTabletLandscape) {
      scrollY.value = 0;
    }
  }, [isTabletLandscape]);

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
    },
  });

  if (isCooking) {
    return <CookingMode recipe={recipe} onClose={() => setIsCooking(false)} />;
  }

  // Render left column (image and header info)
  const renderLeftColumn = () => {
    // In landscape mode, we want the image to be flexible height so all content fits without scrolling
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
        className={`${isTabletLandscape ? "w-[45%] border-r border-border-light bg-surface" : "w-full"} ${isTabletLandscape ? "" : "flex-1"}`}
      >
        <ContentWrapper {...contentWrapperProps}>
          {/* Hero Image */}
          <View
            className={`relative w-full ${isTabletLandscape ? "flex-1" : "aspect-[5/4]"}`}
            onLayout={(event) => {
              const { height } = event.nativeEvent.layout;
              setImageHeight(height);
            }}
          >
            {recipe.image_url ? (
              <Image
                source={{ uri: recipe.image_url }}
                className="h-full w-full"
                resizeMode="cover"
              />
            ) : (
              <View className="h-full w-full items-center justify-center bg-surface-texture-light">
                <Text className="text-foreground-tertiary">{t("recipe.noImage")}</Text>
              </View>
            )}

            {/* Draft Badge */}
            {(isDraft || isEditing) && (
              <View className={`absolute bottom-4 ${isTablet ? "left-8" : "left-4"}`}>
                <View className="rounded-full bg-surface-elevated/90 px-3 py-1.5 shadow-sm">
                  <Text className="text-xs font-bold uppercase tracking-widest text-primary">
                    {isEditing ? t("recipe.previewChanges") : t("recipe.draftPreview")}
                  </Text>
                </View>
              </View>
            )}
          </View>

          {/* Header Info Block */}
          <View className={`${isTablet ? "px-10 py-8" : "px-4 pb-8 pt-6"}`}>
            <Text
              className="font-playfair-bold mb-3 text-[32px] leading-tight text-foreground-heading"
              style={{ fontFamily: "PlayfairDisplay_700Bold" }}
              onLayout={(event) => {
                const { y, height } = event.nativeEvent.layout;
                setTitleLayout({ y, height });
              }}
            >
              {recipe.title}
            </Text>

            {/* Description */}
            {recipe.description && (
              <Text className="mb-6 leading-relaxed text-foreground">{recipe.description}</Text>
            )}

            {/* Rating - Not shown for drafts */}
            {!isDraft && !isEditing && (
              <RecipeRating
                userRating={userRating}
                averageRating={recipe.average_rating}
                ratingCount={recipe.rating_count}
                onRatingChange={handleRatingChange}
              />
            )}

            {/* Stats Grid */}
            <RecipeQuickInfo
              time={totalTime}
              difficulty={recipe.difficulty}
              servings={recipe?.servings}
              onTimePress={handleOpenTimeEdit}
              enableUpdate={!isDraft && !isEditing}
            />

            {/* Primary Actions */}
            <RecipeActionButtons
              onDecline={() => onDiscard?.()}
              onSaveRecipe={() => onSave?.()}
              isOwner={isOwner}
              onEdit={() => router.push(`/recipe/${recipe.id}/edit`)}
              onShare={() => { }}
              onStartCooking={() => setIsCooking(true)}
              isDraft={isDraft}
              isEditing={isEditing}
            />
            {/* Tags */}
            <RecipeTags categories={recipe.categories} tags={recipe.tags} />
          </View>
        </ContentWrapper>
      </View>
    );
  };

  // Render right column (ingredients and instructions)
  const renderRightColumn = () => (
    <ScrollView
      className={`${isTabletLandscape ? "w-[55%] bg-surface-elevated" : "w-full"} `}
      showsVerticalScrollIndicator={false}
      style={{ paddingTop: isTabletLandscape ? insets.top : 0 }}
    >
      <View className={`${isTablet ? "px-10 py-8" : "px-4 pb-8 pt-6"}`}>
        {/* Ingredients Section */}
        <View className="mb-12">
          <Text
            className="font-playfair-bold mb-2 text-2xl uppercase tracking-wide text-foreground-heading"
            style={{ fontFamily: "PlayfairDisplay_700Bold" }}
          >
            {t("recipe.ingredients").toUpperCase()}
          </Text>
          <Text className="mb-4 text-xs text-foreground-muted">{t("recipe.adjustServings")}</Text>

          {/* Servings Selector */}
          <ServingsSelector
            initialServings={recipe.servings || 4}
            currentServings={servings}
            onServingsChange={setServings}
          />
          <RecipeIngredients
            ingredients={recipe.ingredients}
            recipeServings={recipe.servings || 4}
            selectedServings={servings}
          />
        </View>

        {/* Instructions Section */}
        <RecipeInstructions instructions={recipe.instructions} />
      </View>
    </ScrollView>
  );

  // Calculate dynamic scroll thresholds based on title position
  // Title's Y position is relative to its parent, so we add the image height to get absolute scroll position
  const titleAbsoluteY = imageHeight - insets.top - 12;
  const scrollThresholdStart = titleAbsoluteY > 0 ? titleAbsoluteY : 200;
  const calculatedEnd = titleAbsoluteY > 0 ? titleAbsoluteY + titleLayout.height : 244;
  // Ensure end is always greater than start by adding a minimum range
  const scrollThresholdEnd = Math.max(calculatedEnd, scrollThresholdStart + 50);

  // Main layout
  return (
    <View className="flex-1 bg-surface">
      <AnimatedPageHeader
        title={recipe.title}
        scrollY={scrollY}
        onBackPress={!isDraft ? onBack : undefined}
        // onMenuPress={setIsActionSheetVisible(true)}
        onMenuPress={!isDraft ? () => { } : undefined}
        animationConfig={{
          scrollThresholdStart,
          scrollThresholdEnd,
          titleTranslateYStart: 16,
          titleTranslateYEnd: 0,
        }}
      />
      {isTabletLandscape ? (
        <View className="flex-1 flex-row">
          {renderLeftColumn()}
          {renderRightColumn()}
        </View>
      ) : (
        <Animated.ScrollView showsVerticalScrollIndicator={false} onScroll={scrollHandler}>
          {renderLeftColumn()}
          {renderRightColumn()}
        </Animated.ScrollView>
      )}
      <EditCookTimeBottomSheet
        visible={isTimeEditVisible}
        initialPrepMinutes={displayPrepTime}
        initialCookMinutes={displayCookTime}
        originalPrepMinutes={recipe.timings?.prep_time_minutes ?? 0}
        originalCookMinutes={recipe.timings?.cook_time_minutes ?? 0}
        onSave={handleSaveTimes}
        onClose={() => setIsTimeEditVisible(false)}
        isOwner={isOwner}
      />
    </View>
  );
};
