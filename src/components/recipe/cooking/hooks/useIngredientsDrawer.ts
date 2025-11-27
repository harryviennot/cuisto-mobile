import { useState, useCallback } from "react";
import { withTiming, Easing } from "react-native-reanimated";
import type { SharedValue } from "react-native-reanimated";
import * as Haptics from "expo-haptics";

// Animation timing constants
const SHEET_CLOSE_DURATION_MS = 250;
const SHEET_OPEN_DURATION_MS = 300;

export const useIngredientsDrawer = (ingredientsSheetAnim: SharedValue<number>) => {
  const [isIngredientsOpen, setIsIngredientsOpen] = useState(false);
  const [viewAllIngredients, setViewAllIngredients] = useState(false);

  const toggleIngredients = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (isIngredientsOpen) {
      ingredientsSheetAnim.value = withTiming(0, {
        duration: SHEET_CLOSE_DURATION_MS,
        easing: Easing.out(Easing.cubic),
      });
      setIsIngredientsOpen(false);
    } else {
      setIsIngredientsOpen(true);
      ingredientsSheetAnim.value = withTiming(1, {
        duration: SHEET_OPEN_DURATION_MS,
        easing: Easing.out(Easing.cubic),
      });
    }
  }, [isIngredientsOpen, ingredientsSheetAnim]);

  return {
    isIngredientsOpen,
    viewAllIngredients,
    setViewAllIngredients,
    toggleIngredients,
  };
};
