import { useState, useCallback } from "react";
import { useWindowDimensions } from "react-native";
import { withSpring, withTiming, runOnJS } from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import type { Recipe } from "@/types/recipe";
import { useTimerManager } from "./useTimerManager";
import { useStepNavigation } from "./useStepNavigation";
import { useIngredientFiltering } from "./useIngredientFiltering";
import { useCookingAnimations } from "./useCookingAnimations";
import { useIngredientsDrawer } from "./useIngredientsDrawer";

// Animation and timing constants
const ANIMATION_DURATION_MS = 200;
const ANIMATION_DURATION_LONG_MS = 300;
const FINISH_HAPTIC_DELAYS_MS = [0, 100, 200, 350, 550, 800];

// Re-export ActiveTimer type for backward compatibility
export type { ActiveTimer } from "./useTimerManager";

/**
 * Main cooking controller hook - Composes all cooking-related hooks
 * This is a facade that maintains backward compatibility while internally
 * using focused, single-responsibility hooks
 */
export const useCookingController = (recipe: Recipe) => {
  const { width, height } = useWindowDimensions();
  const [selectedTimerIndex, setSelectedTimerIndex] = useState<number | null>(null);

  // Compose focused hooks
  const timerManager = useTimerManager();
  const navigation = useStepNavigation(recipe);
  const animations = useCookingAnimations();
  const ingredientFiltering = useIngredientFiltering(recipe, navigation.step);
  const ingredientsDrawer = useIngredientsDrawer(animations.ingredientsSheetAnim);

  // Navigation with animation orchestration
  const changeStep = useCallback(
    (direction: "next" | "prev") => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Soft);

      if (direction === "next") {
        animations.directionAnim.value = 1;
        if (navigation.currentStep < navigation.totalSteps - 1) {
          // Animate main content
          animations.slideAnim.value = withTiming(-1, { duration: ANIMATION_DURATION_MS }, () => {
            "worklet";
            runOnJS(navigation.goToNextStep)();
            animations.slideAnim.value = 1;
            animations.slideAnim.value = withSpring(0);
          });

          // Animate "Up Next" (rotate down)
          const isGoingToLastStep = navigation.currentStep >= navigation.totalSteps - 2;
          animations.nextStepAnim.value = withTiming(
            1,
            { duration: ANIMATION_DURATION_MS },
            (finished) => {
              "worklet";
              // Only reset if we are NOT going to the last step (where Up Next disappears)
              if (finished && !isGoingToLastStep) {
                animations.nextStepAnim.value = -1; // Reset to top for next entrance
                animations.nextStepAnim.value = withSpring(0);
              }
            }
          );
        } else {
          // Finish Transition
          // Note: markRecipeAsCooked is called from FinishedScreen when user closes it,
          // allowing us to capture the rating and cooking duration at completion time.

          // Custom Premium Haptic Pattern (~1s duration)
          // A "swell" effect inspired by soft haptics
          const playFinishHaptic = async () => {
            // Initial soft taps
            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Soft);
            setTimeout(
              () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Soft),
              FINISH_HAPTIC_DELAYS_MS[1]
            );
            setTimeout(
              () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Soft),
              FINISH_HAPTIC_DELAYS_MS[2]
            );

            // Building up to a medium impact
            setTimeout(
              () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium),
              FINISH_HAPTIC_DELAYS_MS[3]
            );

            // A slightly stronger peak
            setTimeout(
              () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium),
              FINISH_HAPTIC_DELAYS_MS[4]
            );

            // Fading out
            setTimeout(
              () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Soft),
              FINISH_HAPTIC_DELAYS_MS[5]
            );
          };
          runOnJS(playFinishHaptic)();

          // 1. Swipe out the last card
          animations.slideAnim.value = withTiming(-1, { duration: ANIMATION_DURATION_LONG_MS });
          // 2. Fade out the rest of the content
          animations.contentOpacity.value = withTiming(
            0,
            { duration: ANIMATION_DURATION_LONG_MS },
            () => {
              "worklet";
              runOnJS(navigation.finishCooking)();
            }
          );
        }
      } else {
        animations.directionAnim.value = -1;
        if (navigation.currentStep > 0) {
          // Animate main content
          animations.slideAnim.value = withTiming(1, { duration: ANIMATION_DURATION_MS }, () => {
            "worklet";
            runOnJS(navigation.goToPrevStep)();
            animations.slideAnim.value = -1;
            animations.slideAnim.value = withSpring(0);
          });

          // Animate "Up Next" (rotate up)
          animations.nextStepAnim.value = withTiming(
            -1,
            { duration: ANIMATION_DURATION_MS },
            () => {
              "worklet";
              animations.nextStepAnim.value = 1; // Reset to bottom for next entrance
              animations.nextStepAnim.value = withSpring(0);
            }
          );
        }
      }
    },
    [
      navigation.currentStep,
      navigation.totalSteps,
      navigation.goToNextStep,
      navigation.goToPrevStep,
      navigation.finishCooking,
      animations.slideAnim,
      animations.nextStepAnim,
      animations.directionAnim,
      animations.contentOpacity,
      recipe.id,
    ]
  );

  // Return unified interface (maintains backward compatibility)
  return {
    // Navigation state
    currentStep: navigation.currentStep,
    totalSteps: navigation.totalSteps,
    step: navigation.step,
    nextStep: navigation.nextStep,
    instructions: navigation.instructions,
    isFinished: navigation.isFinished,

    // Timer state and functions
    timers: timerManager.timers,
    startTimer: timerManager.startTimer,
    stopTimer: timerManager.stopTimer,
    resetTimer: timerManager.resetTimer,
    toggleTimer: timerManager.toggleTimer,
    formatTime: timerManager.formatTime,
    selectedTimerIndex,
    setSelectedTimerIndex,

    // Ingredients state and functions
    isIngredientsOpen: ingredientsDrawer.isIngredientsOpen,
    viewAllIngredients: ingredientsDrawer.viewAllIngredients,
    setViewAllIngredients: ingredientsDrawer.setViewAllIngredients,
    toggleIngredients: ingredientsDrawer.toggleIngredients,
    allGroupedIngredients: ingredientFiltering.allGroupedIngredients,

    // Animation values
    slideAnim: animations.slideAnim,
    ingredientsSheetAnim: animations.ingredientsSheetAnim,
    nextStepAnim: animations.nextStepAnim,
    directionAnim: animations.directionAnim,
    contentOpacity: animations.contentOpacity,

    // Navigation function
    changeStep,

    // Window dimensions
    width,
    height,
  };
};
