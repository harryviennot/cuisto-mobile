import React, { memo, useState } from "react";
import Toast from "react-native-toast-message";
import { useTranslation } from "react-i18next";
import { EditCookTimeBottomSheet } from "@/components/recipe/modals/EditCookTimeBottomSheet";
import { useUpdateRecipeRating, useUpdateRecipeTimings } from "@/hooks/useRecipes";
import type { Recipe } from "@/types/recipe";

interface RecipeEditManagerProps {
  recipe: Recipe;
  children: (props: {
    userRating?: number;
    displayPrepTime: number;
    displayCookTime: number;
    handleRatingChange: (rating: number) => Promise<void>;
    handleOpenTimeEdit: () => void;
    handleSaveTimings: (prepMinutes: number, cookMinutes: number) => Promise<void>;
    isTimeEditVisible: boolean;
    setIsTimeEditVisible: (visible: boolean) => void;
  }) => React.ReactNode;
}

export const RecipeEditManager = memo(function RecipeEditManager({
  recipe,
  children,
}: RecipeEditManagerProps) {
  const { t } = useTranslation();

  // State
  const [isTimeEditVisible, setIsTimeEditVisible] = useState(false);

  // Mutations
  const updateRatingMutation = useUpdateRecipeRating();
  const updateTimingsMutation = useUpdateRecipeTimings();

  // Get user's custom data or fallback to recipe defaults
  const userRating = recipe.user_data?.rating;
  const displayPrepTime = recipe.user_data?.custom_prep_time_minutes ?? recipe.timings?.prep_time_minutes ?? 0;
  const displayCookTime = recipe.user_data?.custom_cook_time_minutes ?? recipe.timings?.cook_time_minutes ?? 0;

  // Handler for opening the time edit bottom sheet
  const handleOpenTimeEdit = () => {
    setIsTimeEditVisible(true);
  };

  // Handler for saving custom timings
  const handleSaveTimings = async (prepMinutes: number, cookMinutes: number) => {
    try {
      // Calculate new values
      const newPrepMinutes = Math.max(0, prepMinutes);
      const newCookMinutes = Math.max(0, cookMinutes);

      await updateTimingsMutation.mutateAsync({
        recipeId: recipe.id,
        timings: {
          prep_time_minutes: newPrepMinutes,
          cook_time_minutes: newCookMinutes,
        },
      });

      setIsTimeEditVisible(false);
    } catch (error) {
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

  return (
    <>
      {children({
        userRating,
        displayPrepTime,
        displayCookTime,
        handleRatingChange,
        handleOpenTimeEdit,
        handleSaveTimings,
        isTimeEditVisible,
        setIsTimeEditVisible,
      })}

      {/* Time Edit Modal */}
      <EditCookTimeBottomSheet
        visible={isTimeEditVisible}
        onClose={() => setIsTimeEditVisible(false)}
        onSave={handleSaveTimings}
        initialPrepMinutes={displayPrepTime}
        initialCookMinutes={displayCookTime}
        originalPrepMinutes={recipe.timings?.prep_time_minutes ?? 0}
        originalCookMinutes={recipe.timings?.cook_time_minutes ?? 0}
      />
    </>
  );
});