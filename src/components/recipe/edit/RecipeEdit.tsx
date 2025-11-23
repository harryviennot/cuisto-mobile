/**
 * Recipe edit component with iPad landscape support
 * Displays recipe preview and edit forms in a two-column layout on tablets
 */
import React from "react";
import { View, Alert, Text } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useDeviceType } from "@/hooks/useDeviceType";
import { useUpdateRecipe } from "@/hooks/useRecipes";

import type { Recipe } from "@/types/recipe";
import { DifficultyLevel } from "@/types/recipe";
import { RecipeDetail } from "../RecipeDetail";
import { RecipeMainInfoForm } from "./RecipeMainInfoForm";
import { RecipeMetadataForm } from "./RecipeMetadataForm";
import { RecipeCategoriesTagsForm } from "./RecipeCategoriesTagsForm";
import { RecipeIngredientsForm } from "./RecipeIngredientsForm";
import { ShadowItem } from "@/components/ShadowedSection";
import { recipeEditSchema, type RecipeEditFormData } from "@/schemas/recipe.schema";

interface RecipeEditProps {
  recipe: Recipe;
  onSave?: () => void;
  onDiscard?: () => void;
}

export const RecipeEdit: React.FC<RecipeEditProps> = ({ recipe, onSave, onDiscard }) => {
  const insets = useSafeAreaInsets();
  const { isTablet, isTabletLandscape } = useDeviceType();
  const updateRecipeMutation = useUpdateRecipe();

  // Single form instance managing all recipe data
  const {
    control,
    handleSubmit,
    watch,
    reset,
    formState: { isDirty, errors },
  } = useForm<RecipeEditFormData>({
    resolver: zodResolver(recipeEditSchema),
    defaultValues: {
      title: recipe.title,
      description: recipe.description || "",
      image_url: recipe.image_url || "",
      servings: recipe.servings || 4,
      prep_time_minutes: recipe.timings?.prep_time_minutes || 0,
      cook_time_minutes: recipe.timings?.cook_time_minutes || 0,
      difficulty: recipe.difficulty || DifficultyLevel.MEDIUM,
      categories: recipe.categories || [],
      tags: recipe.tags || [],
      ingredients: recipe.ingredients || [],
    },
  });

  // Watch form values for live preview
  const formValues = watch();

  // Build preview recipe from form values
  const previewRecipe: Recipe = {
    ...recipe,
    title: formValues.title,
    description: formValues.description || undefined,
    image_url: formValues.image_url || undefined,
    servings: formValues.servings,
    timings: {
      prep_time_minutes: formValues.prep_time_minutes,
      cook_time_minutes: formValues.cook_time_minutes,
      total_time_minutes: formValues.prep_time_minutes + formValues.cook_time_minutes,
    },
    difficulty: formValues.difficulty,
    categories: formValues.categories,
    tags: formValues.tags,
    ingredients: formValues.ingredients,
  };

  // Final save handler - saves all changes to the server
  const handleSaveAllChanges = handleSubmit(async (data) => {
    try {
      await updateRecipeMutation.mutateAsync({
        recipeId: recipe.id,
        data: {
          title: data.title,
          description: data.description || undefined,
          image_url: data.image_url || undefined,
          servings: data.servings,
          timings: {
            prep_time_minutes: data.prep_time_minutes,
            cook_time_minutes: data.cook_time_minutes,
            total_time_minutes: data.prep_time_minutes + data.cook_time_minutes,
          },
          difficulty: data.difficulty,
          categories: data.categories,
          tags: data.tags,
          ingredients: data.ingredients,
        },
      });

      Alert.alert("Success", "Recipe updated successfully!");
      onSave?.();
    } catch (error) {
      console.error("Failed to update recipe:", error);
      Alert.alert("Error", "Failed to update recipe. Please try again.");
    }
  });

  // Discard changes handler
  const handleDiscardChanges = () => {
    if (isDirty) {
      Alert.alert(
        "Discard Changes?",
        "Are you sure you want to discard your changes? This cannot be undone.",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Discard",
            style: "destructive",
            onPress: () => {
              reset();
              onDiscard?.();
            },
          },
        ]
      );
    } else {
      onDiscard?.();
    }
  };

  // Render left column (preview) - only shown in tablet landscape
  const renderPreview = () => (
    <View className="w-[45%] border-r border-border-light bg-surface">
      <RecipeDetail recipe={previewRecipe} isEditing />
    </View>
  );

  // Render right column (form)
  const renderForm = () => (
    <KeyboardAwareScrollView
      className={`${isTabletLandscape ? "w-[55%] bg-surface-elevated" : "flex-1 bg-surface"}`}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{
        paddingTop: insets.top,
        paddingBottom: insets.bottom + 20, // Extra padding for keyboard
      }}
      bottomOffset={64}
      keyboardShouldPersistTaps="handled"
    >
      <View className={`${isTablet ? "px-10 py-8" : "px-4 pb-8 pt-6"} gap-8`}>
        {/* Main Info Form */}
        <RecipeMainInfoForm control={control} />

        {/* Metadata Form */}
        <RecipeMetadataForm control={control} />

        {/* Categories & Tags Form */}
        <RecipeCategoriesTagsForm control={control} />

        {/* Ingredients Form */}
        <RecipeIngredientsForm control={control} />

        {/* TODO: Instructions form */}

        {/* Action Buttons */}
        <View className="mt-12">
          <View className={`flex-row ${isTablet ? "gap-6" : "gap-4"}`}>
            <ShadowItem
              onPress={handleDiscardChanges}
              className="flex-1 rounded-xl border-border-dark bg-white py-4"
            >
              <Text className="text-center text-base font-semibold text-foreground-heading">
                {isDirty ? "Discard Changes" : "Cancel"}
              </Text>
            </ShadowItem>

            <ShadowItem
              onPress={handleSaveAllChanges}
              className={`flex-1 rounded-xl py-4 ${isDirty ? "" : "opacity-50"}`}
              variant="primary"
            >
              <Text className="text-center text-base font-semibold text-white">
                {updateRecipeMutation.isPending ? "Saving..." : "Save Recipe"}
              </Text>
            </ShadowItem>
          </View>

          {isDirty && (
            <Text className="mt-3 text-center text-sm text-foreground-muted">
              You have unsaved changes
            </Text>
          )}
        </View>
      </View>
    </KeyboardAwareScrollView>
  );

  // Main layout
  return (
    <View className="flex-1 bg-surface">
      {isTabletLandscape ? (
        <View className="flex-1 flex-row">
          {renderPreview()}
          {renderForm()}
        </View>
      ) : (
        renderForm()
      )}
    </View>
  );
};
