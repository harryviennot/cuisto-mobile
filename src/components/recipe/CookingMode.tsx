import React, { useState } from "react";
import { View, StatusBar, Alert } from "react-native";
import { useTranslation } from "react-i18next";
import { Image } from "expo-image";
import { BlurView } from "expo-blur";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import { runOnJS } from "react-native-reanimated";
import type { Recipe } from "@/types/recipe";
import { ChefChat } from "./ChefChat";
import { useCookingController } from "./cooking/hooks/useCookingController";
import { CookingHeader } from "./cooking/CookingHeader";
import { TimerDock } from "./cooking/TimerDock";
import { StepCard } from "./cooking/StepCard";
import { UpNext } from "./cooking/UpNext";
// import { IngredientsDrawer } from "./cooking/IngredientsDrawer";
import { IngredientsDrawerGorhom as IngredientsDrawer } from "./cooking/IngredientsDrawerGorhom";
import { CookingControls } from "./cooking/CookingControls";
import { FinishedScreen } from "./cooking/FinishedScreen";
import { TimerControlModal } from "./cooking/TimerControlModal";

interface CookingModeProps {
  recipe: Recipe;
  onClose: () => void;
}

export const CookingMode: React.FC<CookingModeProps> = ({ recipe, onClose }) => {
  const { t } = useTranslation();
  const [controlsHeight, setControlsHeight] = useState(120); // Default estimate
  const {
    currentStep,
    totalSteps,
    step,
    nextStep,
    isIngredientsOpen,
    viewAllIngredients,
    setViewAllIngredients,
    timers,
    isFinished,
    isChatOpen,
    setIsChatOpen,
    selectedTimerIndex,
    setSelectedTimerIndex,
    slideAnim,
    ingredientsSheetAnim,
    nextStepAnim,
    startTimer,
    stopTimer,
    resetTimer,
    toggleTimer,
    formatTime,
    changeStep,
    toggleIngredients,
    getAllGroupedIngredients,
    width,
    directionAnim,
  } = useCookingController(recipe);

  // Gestures
  const handleStepChange = (direction: "next" | "prev") => {
    if (direction === "next" && currentStep === totalSteps - 1) {
      const hasActiveTimers = timers.some((t) => t.isRunning);
      if (hasActiveTimers) {
        Alert.alert(
          t("common.warning"),
          t("recipe.cookingMode.activeTimersWarning"),
          [
            { text: t("common.cancel"), style: "cancel" },
            {
              text: t("common.confirm"),
              style: "destructive",
              onPress: () => runOnJS(changeStep)("next"),
            },
          ]
        );
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

  if (isFinished) {
    return <FinishedScreen recipe={recipe} onClose={onClose} />;
  }

  const currentTimer = timers.find((t) => t.stepIndex === currentStep);
  const otherTimers = timers
    .filter((t) => t.stepIndex !== currentStep)
    .sort((a, b) => a.timeLeft - b.timeLeft);
  const stepDurationSeconds = step.timer_minutes ? step.timer_minutes * 60 : 0;
  const selectedTimer = timers.find((t) => t.stepIndex === selectedTimerIndex);
  const allGroupedIngredients = getAllGroupedIngredients();

  // Safe computation of visible ingredients with error handling
  const visibleIngredients = React.useMemo(() => {
    try {
      if (viewAllIngredients) {
        return allGroupedIngredients;
      }

      return Object.entries(allGroupedIngredients).reduce((acc, [group, ings]) => {
        if (Array.isArray(ings)) {
          const relevant = ings.filter((i) => i?.isRelevant);
          if (relevant.length > 0) acc[group] = relevant;
        }
        return acc;
      }, {} as typeof allGroupedIngredients);
    } catch (error) {
      console.error('Error computing visible ingredients:', error);
      return {};
    }
  }, [allGroupedIngredients, viewAllIngredients]);

  const hasRelevantIngredients = Object.keys(visibleIngredients).length > 0;

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

      <CookingHeader
        currentStep={currentStep}
        totalSteps={totalSteps}
        onClose={onClose}
        onToggleChat={() => setIsChatOpen(true)}
      />

      <TimerDock
        timers={otherTimers}
        onStopTimer={stopTimer}
        onSelectTimer={setSelectedTimerIndex}
        formatTime={formatTime}
      />

      <StepCard
        step={step}
        currentTimer={currentTimer}
        stepDurationSeconds={stepDurationSeconds}
        slideAnim={slideAnim}
        width={width}
        panGesture={panGesture}
        onStartTimer={startTimer}
        onResetTimer={resetTimer}
        formatTime={formatTime}
        currentStepIndex={currentStep}
        currentStep={step}
        nextStep={nextStep}
        nextStepAnim={nextStepAnim}
        totalSteps={totalSteps}
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

      {isChatOpen && (
        <View className="absolute inset-0 z-[60]">
          <ChefChat
            recipe={recipe}
            currentStepIndex={currentStep}
            onClose={() => setIsChatOpen(false)}
          />
        </View>
      )}

      <TimerControlModal
        selectedTimer={selectedTimer}
        onClose={() => setSelectedTimerIndex(null)}
        onReset={resetTimer}
        onToggle={toggleTimer}
        onStop={stopTimer}
        formatTime={formatTime}
      />
    </View>
  );
};
