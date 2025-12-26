/**
 * Recipe edit component with iPad landscape support
 * Displays recipe preview and edit forms in a two-column layout on tablets
 */
import React, { useRef, useEffect, useState, useMemo } from "react";
import { View, Alert, ScrollView, BackHandler } from "react-native";
import Toast from "react-native-toast-message";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslation } from "react-i18next";
import { useDeviceType } from "@/hooks/useDeviceType";
import { useUpdateRecipe } from "@/hooks/useRecipes";
import { DragProvider, useDragContext } from "@/components/DragAndDrop";

import type { Recipe } from "@/types/recipe";
import { DifficultyLevel } from "@/types/recipe";
import { RecipeDetail } from "./RecipeDetail";
import { RecipeMainInfoForm } from "./edit/RecipeMainInfoForm";
import { RecipeMetadataForm } from "./edit/RecipeMetadataForm";
import { RecipeCategoriesTagsForm } from "./edit/RecipeCategoriesTagsForm";
import { RecipeIngredientsForm } from "./edit/RecipeIngredientsForm";
import { RecipeInstructionsForm } from "./edit/RecipeInstructionsForm";
import { recipeEditSchema, type RecipeEditFormData } from "@/schemas/recipe.schema";

interface RecipeEditProps {
  recipe: Recipe;
  onSave?: () => void;
  onDiscard?: () => void;
}

export interface RecipeEditRef {
  save: () => void;
  discard: () => void;
  isDirty: boolean;
}

// Inner component that uses the drag context
const RecipeEditForm = React.forwardRef<RecipeEditRef, RecipeEditProps>(function RecipeEditForm(
  { recipe, onSave, onDiscard },
  ref
) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { isTablet, isTabletLandscape } = useDeviceType();
  const updateRecipeMutation = useUpdateRecipe();
  const { isDragging, rootScrollViewRef, scrollY } = useDragContext();

  // Single form instance managing all recipe data
  const {
    control,
    handleSubmit,
    watch,
    reset,
    formState: { isDirty },
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
      category_slug: recipe.category?.slug || null,
      tags: recipe.tags || [],
      ingredients: (recipe.ingredients || []).map((ing) => ({
        ...ing,
        quantity: ing.quantity != null ? String(ing.quantity) : undefined,
      })),
      instructions: recipe.instructions || [],
    },
  });

  // Debounced form values for live preview (only on tablet landscape)
  // This prevents render storms from watch() triggering on every keystroke
  const [debouncedValues, setDebouncedValues] = useState<RecipeEditFormData | null>(null);
  const debounceTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    // Only watch form values when we need live preview (tablet landscape)
    if (!isTabletLandscape) {
      return;
    }

    const subscription = watch((values) => {
      // Clear existing timeout
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
      // Debounce updates to prevent render storms
      debounceTimeoutRef.current = setTimeout(() => {
        setDebouncedValues(values as RecipeEditFormData);
      }, 300);
    });

    return () => {
      subscription.unsubscribe();
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, [watch, isTabletLandscape]);

  // Handle Android hardware back button
  useEffect(() => {
    const backAction = () => {
      if (isDirty) {
        Alert.alert(t("recipe.edit.unsavedChangesTitle"), t("recipe.edit.unsavedChangesMessage"), [
          { text: t("common.stay"), style: "cancel" },
          {
            text: t("common.leave"),
            style: "destructive",
            onPress: () => onDiscard?.(),
          },
        ]);
        return true; // Prevent default back behavior
      }
      return false; // Allow default back behavior
    };

    const backHandler = BackHandler.addEventListener("hardwareBackPress", backAction);
    return () => backHandler.remove();
  }, [isDirty, onDiscard, t]);

  // Build preview recipe from debounced form values (memoized)
  // Falls back to original recipe values when no debounced values available
  const previewRecipe = useMemo<Recipe>(() => {
    const values = debouncedValues;
    if (!values) {
      // No debounced values yet, use original recipe
      return recipe;
    }
    return {
      ...recipe,
      title: values.title,
      description: values.description || undefined,
      image_url: values.image_url || undefined,
      servings: values.servings,
      timings: {
        prep_time_minutes: values.prep_time_minutes,
        cook_time_minutes: values.cook_time_minutes,
        total_time_minutes: values.prep_time_minutes + values.cook_time_minutes,
      },
      difficulty: values.difficulty,
      category: values.category_slug ? { id: "", slug: values.category_slug } : null,
      tags: values.tags,
      ingredients: values.ingredients,
      instructions: values.instructions,
    };
  }, [debouncedValues, recipe]);

  // Final save handler - saves all changes to the server
  const handleSaveAllChanges = handleSubmit(
    async (data) => {
      console.log("[RecipeEdit] Save handler called, isDirty:", isDirty);
      if (!isDirty) {
        console.log("[RecipeEdit] Form not dirty, navigating back");
        onSave?.();
        return;
      }
      try {
        console.log("[RecipeEdit] Submitting update with data:", JSON.stringify(data, null, 2));
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
            category_slug: data.category_slug || undefined,
            tags: data.tags,
            ingredients: data.ingredients,
            instructions: data.instructions,
          },
        });
        Toast.show({
          type: "success",
          text1: t("common.success"),
          text2: t("recipe.edit.updateSuccess"),
        });
        onSave?.();
      } catch {
        Toast.show({
          type: "error",
          text1: t("common.error"),
          text2: t("recipe.edit.updateFailed"),
        });
      }
    },
    (errors) => {
      // Log validation errors and show toast
      console.error("[RecipeEdit] Form validation errors:", JSON.stringify(errors, null, 2));
      const errorMessages = Object.entries(errors)
        .map(([field, error]) => `${field}: ${error?.message || "Invalid"}`)
        .join(", ");
      Toast.show({
        type: "error",
        text1: t("common.error"),
        text2: errorMessages || t("recipe.edit.updateFailed"),
      });
    }
  );

  // Discard changes handler
  const handleDiscardChanges = () => {
    if (isDirty) {
      Alert.alert(t("recipe.edit.discardChangesTitle"), t("recipe.edit.discardChangesMessage"), [
        { text: t("common.cancel"), style: "cancel" },
        {
          text: t("common.discard"),
          style: "destructive",
          onPress: () => {
            reset();
            onDiscard?.();
          },
        },
      ]);
    } else {
      onDiscard?.();
    }
  };

  // Expose methods to parent via ref
  React.useImperativeHandle(ref, () => {
    console.log("[RecipeEdit] useImperativeHandle creating ref methods");
    return {
      save: () => {
        console.log("[RecipeEdit] ref.save() called");
        handleSaveAllChanges();
      },
      discard: handleDiscardChanges,
      isDirty,
    };
  });

  // Render left column (preview) - only shown in tablet landscape
  const renderPreview = () => (
    <View className="w-[45%] border-r border-border-light bg-surface">
      <RecipeDetail recipe={previewRecipe} isEditing showHeader={false} />
    </View>
  );

  // Render right column (form)
  const renderForm = () => (
    <KeyboardAwareScrollView
      ref={rootScrollViewRef as any}
      className={`${isTabletLandscape ? "w-[55%] bg-surface-elevated" : "flex-1 bg-surface"}`}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{
        paddingBottom: insets.bottom + 20, // Extra padding for keyboard
      }}
      bottomOffset={64}
      keyboardShouldPersistTaps="handled"
      scrollEnabled={!isDragging}
      onScroll={(e) => {
        scrollY.value = e.nativeEvent.contentOffset.y;
      }}
      scrollEventThrottle={16}
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

        {/* Instructions Form */}
        <RecipeInstructionsForm control={control} />
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
});

// Wrap with DragProvider to enable drag context
export const RecipeEdit = React.forwardRef<RecipeEditRef, RecipeEditProps>((props, ref) => {
  const scrollViewRef = useRef<ScrollView>(null);

  return (
    <DragProvider rootScrollViewRef={scrollViewRef}>
      <RecipeEditForm {...props} ref={ref} />
    </DragProvider>
  );
});

RecipeEdit.displayName = "RecipeEdit";
