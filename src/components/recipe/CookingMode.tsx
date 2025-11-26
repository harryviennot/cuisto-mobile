import React from "react";
import { View, StatusBar } from "react-native";
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
import { IngredientsDrawer } from "./cooking/IngredientsDrawer";
import { CookingControls } from "./cooking/CookingControls";
import { FinishedScreen } from "./cooking/FinishedScreen";
import { TimerControlModal } from "./cooking/TimerControlModal";

interface CookingModeProps {
  recipe: Recipe;
  onClose: () => void;
}

export const CookingMode: React.FC<CookingModeProps> = ({ recipe, onClose }) => {
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
  const panGesture = Gesture.Pan()
    .activeOffsetX([-20, 20])
    .onEnd((e) => {
      if (e.translationX < -50) {
        runOnJS(changeStep)("next");
      } else if (e.translationX > 50) {
        runOnJS(changeStep)("prev");
      }
    });

  if (isFinished) {
    return <FinishedScreen title={recipe.title} onClose={onClose} />;
  }

  const currentTimer = timers.find((t) => t.stepIndex === currentStep);
  const otherTimers = timers
    .filter((t) => t.stepIndex !== currentStep)
    .sort((a, b) => a.timeLeft - b.timeLeft);
  const stepDurationSeconds = step.timer_minutes ? step.timer_minutes * 60 : 0;
  const selectedTimer = timers.find((t) => t.stepIndex === selectedTimerIndex);
  const allGroupedIngredients = getAllGroupedIngredients();
  const visibleIngredients = viewAllIngredients
    ? allGroupedIngredients
    : Object.entries(allGroupedIngredients).reduce((acc, [group, ings]) => {
      const relevant = ings.filter((i) => i.isRelevant);
      if (relevant.length > 0) acc[group] = relevant;
      return acc;
    }, {} as typeof allGroupedIngredients);
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
      />

      <CookingControls
        currentStep={currentStep}
        totalSteps={totalSteps}
        isIngredientsOpen={isIngredientsOpen}
        onChangeStep={changeStep}
        onToggleIngredients={toggleIngredients}
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
