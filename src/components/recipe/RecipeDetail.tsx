/**
 * Recipe detail component with iPad landscape support
 * Displays recipe information in a two-column layout on tablets
 */
import React, { useState } from "react";
import { View, Text, ScrollView, Image, Pressable, useWindowDimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, { useAnimatedScrollHandler, useSharedValue } from "react-native-reanimated";
import { ArrowLeftIcon, DotsThreeIcon, ClockIcon } from "phosphor-react-native";
import { useTranslation } from "react-i18next";
import { router } from "expo-router";

import type { Recipe, Ingredient, Instruction } from "@/types/recipe";
import { CookingMode } from "./CookingMode";
import { StarRating } from "../StarRating";
import { RecipeActionButtons } from "./RecipeActionButtons";
import { RecipeQuickInfo } from "./RecipeQuickInfo";
import { RecipeTags } from "./RecipeTags";
import { AnimatedPageHeader } from "../AnimatedPageHeader";

interface RecipeDetailProps {
  recipe: Recipe;
  onBack: () => void;
  isDraft?: boolean;
  onSave?: () => void;
  onDiscard?: () => void;
}

export const RecipeDetail: React.FC<RecipeDetailProps> = ({
  recipe,
  onBack,
  isDraft = false,
  onSave,
  onDiscard,
}) => {
  const { t } = useTranslation();
  const scrollY = useSharedValue(0);
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const [servings, setServings] = useState(recipe.servings || 4);
  const [isCooking, setIsCooking] = useState(false);
  const [imageHeight, setImageHeight] = useState(0);
  const [titleLayout, setTitleLayout] = useState({ y: 0, height: 0 });

  // Determine if we're in landscape tablet mode
  const isTabletLandscape = width >= 768 && width > height;

  const servingOptions = [2, 4, 6, 8];

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
    },
  });

  // Helper to scale ingredient amounts
  const getScaledAmount = (
    ingredient: Ingredient,
    baseServings: number,
    currentServings: number
  ) => {
    if (!ingredient.quantity || baseServings === currentServings) {
      return ingredient.quantity || "";
    }

    const ratio = currentServings / baseServings;
    const quantity = ingredient.quantity.toString();

    // Try to parse and scale numeric values
    const numMatch = quantity.match(/(\d+\.?\d*)/);
    if (numMatch) {
      const num = parseFloat(numMatch[1]);
      const scaled = num * ratio;
      const scaledStr = Number.isInteger(scaled)
        ? scaled.toString()
        : scaled.toFixed(1).replace(/\.0$/, "");
      return quantity.replace(numMatch[1], scaledStr);
    }

    return quantity;
  };

  // Group ingredients by group field
  const groupedIngredients = recipe.ingredients.reduce(
    (acc, ing) => {
      const group = ing.group || "Main";
      if (!acc[group]) acc[group] = [];
      acc[group].push(ing);
      return acc;
    },
    {} as Record<string, Ingredient[]>
  );

  // Group instructions by group field
  const groupedInstructions = recipe.instructions.reduce(
    (acc, inst) => {
      const group = inst.group || "Main";
      if (!acc[group]) acc[group] = [];
      acc[group].push(inst);
      return acc;
    },
    {} as Record<string, Instruction[]>
  );

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
            className={`relative w-full ${isTabletLandscape ? "flex-1" : "aspect-[4/3]"}`}
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
                <Text className="text-foreground-tertiary">No image</Text>
              </View>
            )}

          {/* Mobile Floating Nav */}
          {/* {!isTabletLandscape && (
            <View
              className="absolute left-0 right-0 top-0 z-20 flex-row items-start justify-between p-6"
              style={{ top: insets.top }}
            >
              <Pressable
                onPress={onBack}
                className="h-10 w-10 items-center justify-center rounded-full bg-surface-elevated/80 shadow-sm active:scale-95"
                style={{ paddingTop: insets.top }}
              >
                <ArrowLeftIcon size={20} color="#3a3226" weight="bold" />
              </Pressable>
              {!isDraft && (
                <Pressable
                  className="h-10 w-10 items-center justify-center rounded-full bg-surface-elevated/80 shadow-sm active:scale-95"
                  style={{ paddingTop: insets.top }}
                >
                  <DotsThreeIcon size={20} color="#3a3226" weight="bold" />
                </Pressable>
              )}
            </View>
          )} */}

          {/* Draft Badge */}
          {isDraft && (
            <View className="absolute bottom-4 left-4">
              <View className="rounded-full bg-surface-elevated/90 px-3 py-1.5 shadow-sm">
                <Text className="text-xs font-bold uppercase tracking-widest text-primary">
                  AI Draft Preview
                </Text>
              </View>
            </View>
          )}
        </View>

        {/* Header Info Block */}
        <View className="px-4 pb-8 pt-6 lg:px-10 lg:py-8">
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
          {!isDraft && (
            <View className="mb-6 gap-1">
              <Text className="text-xs font-medium uppercase tracking-wide text-foreground-muted">
                Your Rating
              </Text>
              <StarRating rating={4.5} onRatingChange={() => {}} editable size={24} />
            </View>
          )}

          {/* Stats Grid */}
          <RecipeQuickInfo
            time={recipe.timings?.total_time_minutes}
            difficulty={recipe.difficulty}
            servings={recipe?.servings}
            onTimePress={() => {}}
          />

          {/* Primary Actions */}
          <RecipeActionButtons
            onDecline={() => onDiscard}
            onSaveRecipe={() => onSave}
            onEdit={() => {}}
            onShare={() => {}}
            onStartCooking={() => setIsCooking(true)}
            isDraft={isDraft}
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
      className={`${isTabletLandscape ? "w-[55%]" : "w-full"} bg-surface-elevated`}
      showsVerticalScrollIndicator={false}
      style={{ paddingTop: isTabletLandscape ? insets.top : 0 }}
    >
      <View className="px-6 py-2 lg:p-12">
        {/* Ingredients Section */}
        <View className="mb-12">
          <Text
            className="font-playfair-bold mb-2 text-2xl uppercase tracking-wide text-foreground-heading"
            style={{ fontFamily: "PlayfairDisplay_700Bold" }}
          >
            INGREDIENTS
          </Text>
          <Text className="mb-6 text-xs text-foreground-muted">
            Adjust servings to scale ingredients automatically
          </Text>

          {/* Servings Selector */}
          <View className="mb-8 overflow-hidden rounded-lg border border-border-light bg-surface-elevated shadow-sm">
            <View className="flex-row">
              {servingOptions.map((opt) => (
                <Pressable
                  key={opt}
                  onPress={() => setServings(opt)}
                  className={`flex-1 items-center justify-center py-3 ${
                    servings === opt ? "bg-primary" : "bg-surface-elevated"
                  }`}
                >
                  <Text
                    className={`text-sm font-medium ${
                      servings === opt ? "text-white" : "text-foreground-heading"
                    }`}
                  >
                    {opt}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          {/* Grouped Ingredients List */}
          <View className="gap-8">
            {Object.entries(groupedIngredients).map(([groupName, ingredients]) => (
              <View key={groupName}>
                {groupName !== "Main" && (
                  <View className="mb-4 mt-2 flex-row items-center gap-4">
                    <Text
                      className="font-playfair-italic shrink-0 text-xs uppercase tracking-widest text-foreground-tertiary"
                      style={{ fontFamily: "PlayfairDisplay_400Regular_Italic" }}
                    >
                      {groupName}
                    </Text>
                    <View className="h-px flex-1 bg-border-light" />
                  </View>
                )}
                <View className="gap-5">
                  {ingredients.map((ing, idx) => (
                    <View key={idx} className="flex-row items-start gap-3">
                      <View className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-foreground-heading" />
                      <View className="w-full flex-1 flex-row flex-wrap items-baseline gap-1 border-b border-border-light pb-4">
                        <Text className="font-bold text-foreground-heading">
                          {getScaledAmount(ing, recipe.servings || 4, servings)}
                        </Text>
                        <Text className="text-foreground-heading">
                          {ing.unit && ` ${ing.unit}`} {ing.name}
                        </Text>
                        {ing.notes && (
                          <Text className="text-sm text-foreground-muted">, {ing.notes}</Text>
                        )}
                      </View>
                    </View>
                  ))}
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Instructions Section */}
        <View className="mb-12">
          <Text
            className="font-playfair-bold mb-8 text-2xl uppercase tracking-wide text-foreground-heading"
            style={{ fontFamily: "PlayfairDisplay_700Bold" }}
          >
            INSTRUCTIONS
          </Text>

          <View className="relative gap-0">
            {Object.entries(groupedInstructions).map(([groupName, instructions], groupIdx) => {
              const allInstructions = recipe.instructions;
              const firstInstInGroup = instructions[0];
              const groupStartIndex = allInstructions.indexOf(firstInstInGroup);

              return (
                <View key={groupName}>
                  {/* Group Header */}
                  {groupName !== "Main" && groupIdx > 0 && (
                    <View className="mb-6 mt-10 flex-row items-center">
                      <Text
                        className="font-playfair-italic shrink-0 pr-4 text-xl text-primary"
                        style={{ fontFamily: "PlayfairDisplay_400Regular_Italic" }}
                      >
                        {groupName}
                      </Text>
                      <View className="h-px flex-1 bg-border-light opacity-60" />
                    </View>
                  )}

                  {/* Instructions */}
                  {instructions.map((inst, idx) => {
                    const isLast =
                      groupIdx === Object.keys(groupedInstructions).length - 1 &&
                      idx === instructions.length - 1;

                    return (
                      <View key={idx} className="relative">
                        <View className="flex-row gap-5">
                          {/* Connecting Line */}
                          {!isLast && (
                            <View className="absolute bottom-[-32] left-[15px] top-8 z-0 w-[1px] bg-border-light" />
                          )}

                          {/* Step Indicator */}
                          <View className="z-10 h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 border-primary bg-surface-elevated shadow-sm">
                            <Text className="text-sm font-bold text-primary">
                              {inst.step_number}
                            </Text>
                          </View>

                          <View className="flex-1 pb-8">
                            {/* Header */}
                            <View className="mb-2 flex-row items-start justify-between">
                              <Text className="flex-1 pt-0.5 text-xl font-bold text-foreground-heading">
                                {inst.title}
                              </Text>
                              {inst.timer_minutes && (
                                <View className="mt-1.5 flex-row items-center gap-1 rounded-full bg-surface-elevated px-2 py-1">
                                  <ClockIcon size={12} color="#78716c" />
                                  <Text className="text-xs text-foreground-muted">
                                    {inst.timer_minutes} min
                                  </Text>
                                </View>
                              )}
                            </View>

                            {/* Description */}
                            <Text className="text-[15px] leading-relaxed text-foreground-secondary">
                              {inst.description}
                            </Text>
                          </View>
                        </View>
                      </View>
                    );
                  })}
                </View>
              );
            })}
          </View>
        </View>
      </View>
    </ScrollView>
  );

  // Calculate dynamic scroll thresholds based on title position
  // Title's Y position is relative to its parent, so we add the image height to get absolute scroll position
  const titleAbsoluteY = imageHeight - insets.top;
  const scrollThresholdStart = titleAbsoluteY > 0 ? titleAbsoluteY : 200;
  const scrollThresholdEnd =
    titleAbsoluteY > 0 ? titleAbsoluteY + titleLayout.height - insets.top : 244;

  // Main layout
  return (
    <View className="flex-1 bg-surface">
      <AnimatedPageHeader
        title={recipe.title}
        scrollY={scrollY}
        onBackPress={() => router.back()}
        // onMenuPress={setIsActionSheetVisible(true)}
        onMenuPress={() => {}}
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
    </View>
  );
};
