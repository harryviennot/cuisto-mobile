import React, { useState } from "react";
import { View, StatusBar, Alert } from "react-native";
import { useTranslation } from "react-i18next";
import { Image } from "expo-image";
import { BlurView } from "expo-blur";
import { Gesture } from "react-native-gesture-handler";
import Animated, { runOnJS, useAnimatedStyle } from "react-native-reanimated";
import type { Recipe } from "@/types/recipe";
import { useCookingController } from "./cooking/hooks/useCookingController";
import { CookingHeader } from "./cooking/CookingHeader";
import { TimerDock } from "./cooking/TimerDock";
import { StepCard } from "./cooking/StepCard";
import { IngredientsDrawer } from "./cooking/IngredientsDrawer";
import { CookingControls } from "./cooking/CookingControls";
import { FinishedScreen } from "./cooking/FinishedScreen";
import { TimerControlModal } from "./cooking/TimerControlModal";
import Toast from "react-native-toast-message";

interface CookingModeProps {
  recipe: Recipe;
  onClose: () => void;
}

/**
 * CookingMode - Main cooking mode orchestrator
 * Components now use focused hooks directly, reducing prop drilling
 */
export const CookingMode: React.FC<CookingModeProps> = ({ recipe, onClose }) => {
  const { t } = useTranslation();
  const [controlsHeight, setControlsHeight] = useState(120); // Default estimate

  // Main controller provides orchestration and complex interactions
  const {
    currentStep,
    totalSteps,
    step,
    nextStep,
    isIngredientsOpen,
    viewAllIngredients,
    setViewAllIngredients,
    isFinished,
    selectedTimerIndex,
    setSelectedTimerIndex,
    timers,
    startTimer,
    stopTimer,
    resetTimer,
    toggleTimer,
    formatTime,
    slideAnim,
    ingredientsSheetAnim,
    nextStepAnim,
    changeStep,
    toggleIngredients,
    allGroupedIngredients,
    directionAnim,
    contentOpacity,
  } = useCookingController(recipe);

  // Gestures
  const handleStepChange = (direction: "next" | "prev") => {
    if (direction === "next" && currentStep === totalSteps - 1) {
      const hasActiveTimers = timers.some((t) => t.isRunning);
      if (hasActiveTimers) {
        Alert.alert(t("common.warning"), t("recipe.cookingMode.activeTimersWarning"), [
          { text: t("common.cancel"), style: "cancel" },
          {
            text: t("common.confirm"),
            style: "destructive",
            onPress: () => runOnJS(changeStep)("next"),
          },
        ]);
        return;
      }
    }
    runOnJS(changeStep)(direction);
  };

  const panGesture = Gesture.Pan()
    .activeOffsetX([-20, 20])
    .onEnd((e) => {
      if (e.translationX < -50) {
        runOnJS(handleStepChange)("next");
      } else if (e.translationX > 50) {
        runOnJS(handleStepChange)("prev");
      }
    });

  // Safe computation of visible ingredients with error handling
  const visibleIngredients = React.useMemo(() => {
    try {
      if (viewAllIngredients) {
        return allGroupedIngredients;
      }

      return Object.entries(allGroupedIngredients).reduce(
        (acc, [group, ings]) => {
          if (Array.isArray(ings)) {
            const relevant = ings.filter((i) => i?.isRelevant);
            if (relevant.length > 0) acc[group] = relevant;
          }
          return acc;
        },
        {} as typeof allGroupedIngredients
      );
    } catch (error) {
      console.error("Error computing visible ingredients:", error);
      return {};
    }
  }, [allGroupedIngredients, viewAllIngredients]);

  const hasRelevantIngredients = Object.keys(visibleIngredients).length > 0;

  // Fade out style for content
  const contentStyle = useAnimatedStyle(() => {
    return {
      opacity: contentOpacity.value,
    };
  });

  return (
    <View className="flex-1 bg-black">
      <StatusBar barStyle="light-content" />

      {/* Immersive Background */}
      <View className="absolute inset-0 opacity-40">
        <Image
          source={{ uri: recipe.image_url }}
          style={{ width: "100%", height: "100%" }}
          contentFit="cover"
        />
        <BlurView intensity={30} tint="dark" style={{ position: "absolute", inset: 0 }} />
      </View>

      {isFinished ? (
        <FinishedScreen recipe={recipe} onClose={onClose} />
      ) : (
        <>
          <Animated.View style={[{ flex: 1 }, contentStyle]}>
            <CookingHeader
              currentStep={currentStep}
              totalSteps={totalSteps}
              onClose={onClose}
              onToggleChat={() =>
                Toast.show({
                  type: "info",
                  text1: "Coming soon!",
                  text2: "Chat is not yet available in cooking mode",
                })
              }
            />

            <TimerDock
              currentStep={currentStep}
              timers={timers}
              stopTimer={stopTimer}
              formatTime={formatTime}
              onSelectTimer={setSelectedTimerIndex}
            />

            <StepCard
              recipe={recipe}
              currentStep={currentStep}
              step={step}
              nextStep={nextStep}
              totalSteps={totalSteps}
              timers={timers}
              startTimer={startTimer}
              resetTimer={resetTimer}
              formatTime={formatTime}
              slideAnim={slideAnim}
              panGesture={panGesture}
              nextStepAnim={nextStepAnim}
              directionAnim={directionAnim}
            />

            <IngredientsDrawer
              isIngredientsOpen={isIngredientsOpen}
              ingredientsSheetAnim={ingredientsSheetAnim}
              viewAllIngredients={viewAllIngredients}
              setViewAllIngredients={setViewAllIngredients}
              visibleIngredients={visibleIngredients}
              hasRelevantIngredients={hasRelevantIngredients}
              onToggle={toggleIngredients}
              controlsHeight={controlsHeight}
            />

            <CookingControls
              currentStep={currentStep}
              totalSteps={totalSteps}
              isIngredientsOpen={isIngredientsOpen}
              onChangeStep={handleStepChange}
              onToggleIngredients={toggleIngredients}
              onLayout={setControlsHeight}
            />
          </Animated.View>

          <TimerControlModal
            selectedTimerIndex={selectedTimerIndex}
            timers={timers}
            resetTimer={resetTimer}
            toggleTimer={toggleTimer}
            stopTimer={stopTimer}
            formatTime={formatTime}
            onClose={() => setSelectedTimerIndex(null)}
          />
        </>
      )}
    </View>
  );
};
