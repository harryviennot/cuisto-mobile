import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  Pressable,
  ScrollView,
  useWindowDimensions,
  BackHandler,
  Platform,
  StatusBar,
  Modal,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Image } from "expo-image";
import { BlurView } from "expo-blur";
import {
  X,
  CaretRight,
  CaretLeft,
  Clock,
  Check,
  ArrowUp,
  Sparkle,
  Pause,
  Play,
  ArrowCounterClockwise,
  Stack,
  List,
  Trash,
} from "phosphor-react-native";
import { useTranslation } from "react-i18next";
import Animated, {
  FadeIn,
  FadeOut,
  SlideInDown,
  SlideInUp,
  SlideOutDown,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  interpolate,
  Extrapolation,
  runOnJS,
  Keyframe,
  ZoomIn,
  ZoomOut,
} from "react-native-reanimated";
import { GestureDetector, Gesture } from "react-native-gesture-handler";
import * as Haptics from "expo-haptics";
import { useKeepAwake } from "expo-keep-awake";
import { Audio } from "expo-av";
import type { Recipe, Ingredient } from "@/types/recipe";
import { ChefChat } from "./ChefChat";

interface CookingModeProps {
  recipe: Recipe;
  onClose: () => void;
}

interface ActiveTimer {
  stepIndex: number;
  label: string;
  duration: number;
  timeLeft: number;
  isRunning: boolean;
}

export const CookingMode: React.FC<CookingModeProps> = ({ recipe, onClose }) => {
  useKeepAwake(); // Keep screen on
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();

  // State
  const [currentStep, setCurrentStep] = useState(0);
  const [isIngredientsOpen, setIsIngredientsOpen] = useState(false);
  const [viewAllIngredients, setViewAllIngredients] = useState(false);
  const [timers, setTimers] = useState<ActiveTimer[]>([]);
  const [isFinished, setIsFinished] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [selectedTimerIndex, setSelectedTimerIndex] = useState<number | null>(null);

  // Animation values
  const slideAnim = useSharedValue(0); // 0 = center, -1 = left, 1 = right
  const ingredientsSheetAnim = useSharedValue(0); // 0 = closed, 1 = open
  const nextStepAnim = useSharedValue(0); // For "Up Next" rotation: 0 -> 1 (next), 0 -> -1 (prev)

  const instructions = recipe.instructions.sort((a, b) => a.step_number - b.step_number);
  const totalSteps = instructions.length;
  const step = instructions[currentStep];
  const nextStep = instructions[currentStep + 1];

  // Sound
  const [sound, setSound] = useState<Audio.Sound>();

  useEffect(() => {
    return () => {
      sound?.unloadAsync();
    };
  }, [sound]);

  const playTimerDoneSound = async () => {
    try {
      // Placeholder for sound logic
    } catch (error) {
      console.log('Error playing sound', error);
    }
  };

  // Timer Logic
  useEffect(() => {
    const interval = setInterval(() => {
      setTimers((prevTimers) =>
        prevTimers.map((t) => {
          if (!t.isRunning) return t;
          if (t.timeLeft <= 0) return t;

          const newTime = t.timeLeft - 1;
          if (newTime === 0) {
            playTimerDoneSound();
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          }
          return { ...t, timeLeft: newTime };
        })
      );
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const startTimer = (stepIndex: number, durationMinutes: number | undefined, title: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const durationSeconds = durationMinutes ? durationMinutes * 60 : 0;
    if (!durationSeconds) return;

    const exists = timers.find((t) => t.stepIndex === stepIndex);
    if (exists) {
      setTimers((prev) =>
        prev.map((t) => (t.stepIndex === stepIndex ? { ...t, isRunning: !t.isRunning } : t))
      );
    } else {
      setTimers((prev) => [
        ...prev,
        {
          stepIndex,
          label: title, // Use title instead of "Step X"
          duration: durationSeconds,
          timeLeft: durationSeconds,
          isRunning: true,
        },
      ]);
    }
  };

  const stopTimer = (stepIndex: number) => {
    setTimers((prev) => prev.filter((t) => t.stepIndex !== stepIndex));
    if (selectedTimerIndex === stepIndex) setSelectedTimerIndex(null);
  };

  const resetTimer = (stepIndex: number) => {
    setTimers((prev) =>
      prev.map((t) =>
        t.stepIndex === stepIndex ? { ...t, timeLeft: t.duration, isRunning: false } : t
      )
    );
  };

  const toggleTimer = (stepIndex: number) => {
    setTimers((prev) =>
      prev.map((t) => (t.stepIndex === stepIndex ? { ...t, isRunning: !t.isRunning } : t))
    );
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  // Navigation
  const changeStep = (direction: "next" | "prev") => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    if (direction === "next") {
      if (currentStep < totalSteps - 1) {
        // Animate main content
        slideAnim.value = withTiming(-1, { duration: 200 }, () => {
          runOnJS(setCurrentStep)(currentStep + 1);
          slideAnim.value = 1;
          slideAnim.value = withSpring(0);
        });

        // Animate "Up Next" (rotate down)
        nextStepAnim.value = withTiming(1, { duration: 200 }, () => {
          // Only reset if we are NOT going to the last step (where Up Next disappears)
          if (currentStep < totalSteps - 2) {
            nextStepAnim.value = -1; // Reset to top for next entrance
            nextStepAnim.value = withSpring(0);
          }
        });
      } else {
        setIsFinished(true);
      }
    } else {
      if (currentStep > 0) {
        // Animate main content
        slideAnim.value = withTiming(1, { duration: 200 }, () => {
          runOnJS(setCurrentStep)(currentStep - 1);
          slideAnim.value = -1;
          slideAnim.value = withSpring(0);
        });

        // Animate "Up Next" (rotate up)
        nextStepAnim.value = withTiming(-1, { duration: 200 }, () => {
          nextStepAnim.value = 1; // Reset to bottom for next entrance
          nextStepAnim.value = withSpring(0);
        });
      }
    }
  };

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

  // Ingredients Logic
  const getAllGroupedIngredients = () => {
    const text = (step.description + " " + (step.title || "")).toLowerCase();

    // Annotate with relevance
    const annotated = recipe.ingredients.map(ing => {
      const firstWord = ing.name.toLowerCase().split(' ')[0];
      const isRelevant = text.includes(firstWord);
      return { ...ing, isRelevant };
    });

    return annotated.reduce((acc, ing) => {
      const group = (ing as any).group || 'Main';
      if (!acc[group]) acc[group] = [];
      acc[group].push(ing);
      return acc;
    }, {} as Record<string, (Ingredient & { isRelevant: boolean })[]>);
  };

  const allGroupedIngredients = getAllGroupedIngredients();

  const visibleIngredients = viewAllIngredients
    ? allGroupedIngredients
    : Object.entries(allGroupedIngredients).reduce((acc, [group, ings]) => {
      const relevant = ings.filter(i => i.isRelevant);
      if (relevant.length > 0) acc[group] = relevant;
      return acc;
    }, {} as typeof allGroupedIngredients);

  const hasRelevantIngredients = Object.keys(visibleIngredients).length > 0;

  // Animations
  const contentAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateX: interpolate(slideAnim.value, [-1, 0, 1], [-width, 0, width]) },
        { scale: interpolate(slideAnim.value, [-1, 0, 1], [0.9, 1, 0.9]) },
      ],
      opacity: interpolate(slideAnim.value, [-1, 0, 1], [0, 1, 0]),
    };
  });

  const nextStepAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateY: interpolate(nextStepAnim.value, [-1, 0, 1], [-10, 0, 10]) },
      ],
      opacity: interpolate(nextStepAnim.value, [-1, 0, 1], [0, 1, 0]),
    };
  });

  const labelAnimatedStyle = useAnimatedStyle(() => {
    // Animate label out only when moving to the last step
    if (currentStep === totalSteps - 2 && nextStepAnim.value > 0) {
      return {
        opacity: interpolate(nextStepAnim.value, [0, 1], [1, 0]),
        transform: [{ translateY: interpolate(nextStepAnim.value, [0, 1], [0, 10]) }],
      };
    }
    return { opacity: 1, transform: [{ translateY: 0 }] };
  }, [currentStep, totalSteps]);

  const ingredientsSheetStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateY: interpolate(ingredientsSheetAnim.value, [0, 1], [height * 0.4, 0]) },
      ],
      opacity: interpolate(ingredientsSheetAnim.value, [0, 1], [0, 1]),
    };
  });

  // Toggle Ingredients
  const toggleIngredients = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (isIngredientsOpen) {
      ingredientsSheetAnim.value = withTiming(0);
      setIsIngredientsOpen(false);
    } else {
      setIsIngredientsOpen(true);
      ingredientsSheetAnim.value = withSpring(1);
    }
  };

  // Finished State
  if (isFinished) {
    return (
      <View className="flex-1 items-center justify-center bg-[#FDFBF7] px-8">
        <StatusBar barStyle="dark-content" />
        <Animated.View entering={FadeIn.duration(500)} className="items-center">
          <View className="mb-8 h-24 w-24 items-center justify-center rounded-full bg-primary shadow-xl shadow-primary/20">
            <Check size={48} color="white" weight="bold" />
          </View>
          <Text className="mb-4 text-center font-playfair text-4xl text-foreground-heading" style={{ fontFamily: "PlayfairDisplay_700Bold" }}>
            {t("common.bonAppetit")}
          </Text>
          <Text className="mb-12 text-center text-lg text-foreground-secondary">
            {t("recipe.cookingMode.finishedMessage", { title: recipe.title })}
          </Text>

          <View className="w-full flex-row gap-4">
            <Pressable
              onPress={onClose}
              className="flex-1 rounded-xl bg-surface-elevated py-4 active:opacity-80"
            >
              <Text className="text-center text-lg font-bold text-foreground-heading">{t("common.close")}</Text>
            </Pressable>
            <Pressable
              onPress={onClose}
              className="flex-1 rounded-xl bg-primary py-4 shadow-lg active:opacity-80"
            >
              <Text className="text-center text-lg font-bold text-white">{t("recipe.rateRecipe")}</Text>
            </Pressable>
          </View>
        </Animated.View>
      </View>
    );
  }

  const currentTimer = timers.find(t => t.stepIndex === currentStep);
  // Sort other timers by time left (smallest first)
  const otherTimers = timers
    .filter(t => t.stepIndex !== currentStep)
    .sort((a, b) => a.timeLeft - b.timeLeft);

  const stepDurationSeconds = step.timer_minutes ? step.timer_minutes * 60 : 0;
  const selectedTimer = timers.find(t => t.stepIndex === selectedTimerIndex);

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
        <BlurView intensity={30} tint="dark" style={{ position: 'absolute', inset: 0 }} />
      </View>

      {/* Header */}
      <View
        className="z-10 flex-row items-center justify-between px-6 pb-2"
        style={{ paddingTop: insets.top + 12 }}
      >
        <Pressable
          onPress={onClose}
          className="-ml-2 rounded-full p-2 active:bg-white/10"
        >
          <X size={24} color="white" />
        </Pressable>

        <View className="items-center">
          <Text className="text-xs font-bold uppercase tracking-widest text-white/80">
            {t("recipe.cookingMode.step")} {currentStep + 1} {t("common.of")} {totalSteps}
          </Text>
          <View className="mt-2 flex-row gap-1">
            {instructions.map((_, idx) => (
              <View
                key={idx}
                className={`h-1 rounded-full transition-all ${idx === currentStep ? "w-6 bg-white" :
                  idx < currentStep ? "w-1.5 bg-white/60" : "w-1.5 bg-white/20"
                  }`}
              />
            ))}
          </View>
        </View>

        <Pressable
          onPress={() => setIsChatOpen(true)}
          className="rounded-full border border-white/10 bg-white/10 p-2 backdrop-blur-md active:bg-white/20"
        >
          <Sparkle size={20} color="white" weight="fill" />
        </Pressable>
      </View>

      {/* Active Timers Dock */}
      {otherTimers.length > 0 && (
        <View className="z-10 py-2">
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 24, gap: 8 }}
          >
            {otherTimers.map((t) => (
              <Pressable
                key={t.stepIndex}
                onLongPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
                  setSelectedTimerIndex(t.stepIndex);
                }}
                delayLongPress={300}
              >
                <Animated.View
                  entering={SlideInUp}
                  exiting={FadeOut}
                  className="flex-row items-center gap-2 rounded-full border border-white/10 bg-black/60 px-3 py-1.5 backdrop-blur-md"
                >
                  <Text className="text-[10px] font-bold uppercase tracking-wider text-white/60">{t.label}</Text>
                  <Text className={`font-mono text-sm font-medium ${t.timeLeft === 0 ? "text-red-400" : "text-white"}`}>
                    {formatTime(t.timeLeft)}
                  </Text>
                  <Pressable onPress={() => stopTimer(t.stepIndex)} className="ml-1">
                    <X size={12} color="#a8a29e" />
                  </Pressable>
                </Animated.View>
              </Pressable>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Main Content */}
      <GestureDetector gesture={panGesture}>
        <View className="flex-1 justify-center items-center px-4 py-4">
          <Animated.View style={[contentAnimatedStyle, { height: '100%', maxHeight: 450, maxWidth: 650, width: '100%' }]}>
            <View className="relative flex-1 overflow-hidden rounded-[32px] bg-[#FDFBF7] shadow-2xl">
              {/* Step Number Watermark */}
              <Text className="absolute -right-4 -top-4 font-playfair text-[120px] font-bold leading-none text-surface-texture-dark opacity-10">
                {step.step_number}
              </Text>

              <ScrollView
                className="flex-1"
                contentContainerStyle={{ padding: 32, flexGrow: 1 }}
                showsVerticalScrollIndicator={false}
              >
                {/* Group Header */}
                {step.group && step.group !== "Main" && (
                  <View className="mb-4 flex-row items-center gap-3">
                    <View className="h-px w-8 bg-primary/30" />
                    <Text className="text-xs font-bold uppercase tracking-widest text-primary">
                      {step.group}
                    </Text>
                  </View>
                )}

                <Text
                  className="mb-6 pr-8 font-playfair text-4xl text-foreground-heading"
                  style={{ fontFamily: "PlayfairDisplay_700Bold" }}
                >
                  {step.title}
                </Text>
                <Text
                  className="mb-6 pr-8 text-2xl text-foreground-text leading-snug"
                >
                  {step.description}
                </Text>

                {/* Spacer to push timer to bottom */}
                <View className="flex-1" />

                {/* Timer Control */}
                {(step.timer_minutes || 0) > 0 && (
                  <View className={`mt-auto flex-row items-center justify-between rounded-2xl border-2 p-4 transition-all ${currentTimer?.isRunning ? "border-primary bg-primary/5" : "border-border bg-surface-elevated"
                    }`}>
                    <View className="flex-row items-center gap-4">
                      <View className={`h-12 w-12 items-center justify-center rounded-full ${currentTimer?.isRunning ? "bg-primary" : "bg-surface-texture-dark"
                        }`}>
                        <Clock size={24} color={currentTimer?.isRunning ? "white" : "#a8a29e"} weight={currentTimer?.isRunning ? "fill" : "regular"} />
                      </View>
                      <View>
                        <Text className="text-xs font-bold uppercase tracking-wide text-foreground-muted">
                          {currentTimer?.isRunning ? t("recipe.cookingMode.timerRunning") : t("recipe.cookingMode.recommendedTime")}
                        </Text>
                        <Text className={`font-mono text-2xl font-medium ${currentTimer?.isRunning ? "text-primary" : "text-foreground-heading"}`}>
                          {formatTime(currentTimer ? currentTimer.timeLeft : stepDurationSeconds)}
                        </Text>
                      </View>
                    </View>

                    <View className="flex-row gap-2">
                      {!currentTimer ? (
                        <Pressable
                          onPress={() => startTimer(currentStep, step.timer_minutes, step.title || `Step ${step.step_number}`)}
                          className="h-10 w-10 items-center justify-center rounded-full bg-primary shadow-lg active:scale-90"
                        >
                          <Play size={18} color="white" weight="fill" />
                        </Pressable>
                      ) : (
                        <>

                          {!currentTimer.isRunning && (
                            <Pressable
                              onPress={() => resetTimer(currentStep)}
                              className="h-10 w-10 items-center justify-center rounded-full bg-surface-texture-dark active:scale-90"
                            >
                              <ArrowCounterClockwise size={18} color="#78716c" />
                            </Pressable>
                          )}
                          <Pressable
                            onPress={() => startTimer(currentStep, step.timer_minutes, step.title || `Step ${step.step_number}`)}
                            className={`h-10 w-10 items-center justify-center rounded-full active:scale-90 ${currentTimer.isRunning ? "bg-orange-100" : "bg-primary"
                              }`}
                          >
                            {currentTimer.isRunning ? (
                              <Pause size={18} color="#ea580c" weight="fill" />
                            ) : (
                              <Play size={18} color="white" weight="fill" />
                            )}
                          </Pressable>
                        </>
                      )}
                    </View>
                  </View>
                )}
              </ScrollView>
            </View>
          </Animated.View>
        </View>
      </GestureDetector>

      {/* Up Next - Sticky at Bottom */}
      {nextStep && (
        <View
          className="absolute left-0 right-0 z-0 items-center justify-center px-8 pb-4"
          style={{ bottom: 128 + insets.bottom }}
        >
          <Animated.Text
            style={labelAnimatedStyle}
            className="mb-1 text-center text-[10px] uppercase tracking-widest text-white/60"
          >
            {t("common.upNext")}
          </Animated.Text>
          <Animated.View style={nextStepAnimatedStyle}>
            <Text className="truncate text-center font-playfair text-base text-white/90" numberOfLines={1}>
              {nextStep.group && nextStep.group !== step.group ? `${nextStep.group}: ` : ""}
              {nextStep.title || nextStep.description}
            </Text>
          </Animated.View>
        </View>
      )}

      {/* Ingredients Drawer */}
      {isIngredientsOpen && (
        <Animated.View
          style={[
            {
              position: 'absolute',
              bottom: 100,
              left: 16,
              right: 16,
              maxHeight: height * 0.5,
              backgroundColor: 'rgba(255, 255, 255, 0.95)',
              borderRadius: 24,
              borderWidth: 1,
              borderColor: 'rgba(255, 255, 255, 0.5)',
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 10 },
              shadowOpacity: 0.3,
              shadowRadius: 20,
              elevation: 10,
              zIndex: 40,
              overflow: 'hidden'
            },
            ingredientsSheetStyle
          ]}
        >
          <View className="border-b border-border-light bg-white/50 px-5 pb-3 pt-4 backdrop-blur-xl">
            <View className="mb-3 flex-row items-center justify-between">
              <Text className="font-playfair text-xl text-foreground-heading">{t("recipe.ingredients")}</Text>
              <Pressable onPress={toggleIngredients} className="rounded-full bg-surface-texture-light p-1.5">
                <X size={16} color="#78716c" />
              </Pressable>
            </View>

            <View className="flex-row rounded-lg bg-surface-texture-light p-1">
              <Pressable
                onPress={() => setViewAllIngredients(false)}
                className={`flex-1 flex-row items-center justify-center gap-1.5 rounded-md py-1.5 ${!viewAllIngredients ? "bg-white shadow-sm" : ""}`}
              >
                <Stack size={14} color={!viewAllIngredients ? "#334d43" : "#78716c"} />
                <Text className={`text-xs font-bold uppercase tracking-wide ${!viewAllIngredients ? "text-primary" : "text-foreground-muted"}`}>
                  {t("recipe.cookingMode.thisStep")}
                </Text>
              </Pressable>
              <Pressable
                onPress={() => setViewAllIngredients(true)}
                className={`flex-1 flex-row items-center justify-center gap-1.5 rounded-md py-1.5 ${viewAllIngredients ? "bg-white shadow-sm" : ""}`}
              >
                <List size={14} color={viewAllIngredients ? "#334d43" : "#78716c"} />
                <Text className={`text-xs font-bold uppercase tracking-wide ${viewAllIngredients ? "text-primary" : "text-foreground-muted"}`}>
                  {t("recipe.cookingMode.allItems")}
                </Text>
              </Pressable>
            </View>
          </View>

          <ScrollView className="px-5 py-2">
            {!viewAllIngredients && !hasRelevantIngredients ? (
              <View className="py-8 items-center">
                <Text className="mb-2 text-center text-foreground-muted italic">
                  {t("recipe.cookingMode.noIngredientsForStep")}
                </Text>
                <Pressable onPress={() => setViewAllIngredients(true)}>
                  <Text className="border-b border-primary/30 text-xs font-bold uppercase tracking-widest text-primary">
                    {t("recipe.cookingMode.viewFullList")}
                  </Text>
                </Pressable>
              </View>
            ) : (
              Object.entries(visibleIngredients).map(([groupName, ingredients]) => (
                <View key={groupName} className="mb-4">
                  {groupName !== "Main" && (
                    <Text className="mb-2 text-[10px] font-bold uppercase tracking-widest text-foreground-muted">
                      {groupName}
                    </Text>
                  )}
                  <View className="gap-3">
                    {ingredients.map((ing, idx) => (
                      <View key={idx} className={`flex-row justify-between ${!ing.isRelevant && !viewAllIngredients ? "opacity-50" : "opacity-100"}`}>
                        <View className="flex-1 flex-row items-start gap-3">
                          <View className={`mt-1.5 h-1.5 w-1.5 rounded-full ${ing.isRelevant ? "bg-primary" : "bg-border-button"}`} />
                          <Text className={`flex-1 font-medium leading-snug ${ing.isRelevant ? "text-foreground-heading font-bold" : "text-foreground-secondary"}`}>
                            {ing.name}
                          </Text>
                        </View>
                        <Text className="text-right text-sm font-medium text-foreground-muted">{ing.quantity} {ing.unit}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              ))
            )}
            <View className="h-4" />
          </ScrollView>
        </Animated.View>
      )}

      {/* Bottom Controls */}
      <View
        className="z-50 flex-row items-stretch gap-4 border-t border-white/10 bg-black/80 px-6 pb-8 pt-6 backdrop-blur-lg"
        style={{ paddingBottom: insets.bottom + 16 }}
      >
        <Pressable
          onPress={() => changeStep("prev")}
          disabled={currentStep === 0}
          className={`h-16 w-16 items-center justify-center rounded-2xl bg-white/10 active:scale-95 ${currentStep === 0 ? "opacity-20" : "opacity-100"}`}
        >
          <CaretLeft size={28} color="white" />
        </Pressable>

        <Pressable
          onPress={toggleIngredients}
          className={`flex-1 flex-col items-center justify-center gap-1 rounded-2xl border active:scale-95 transition-all ${isIngredientsOpen
            ? "bg-white border-white"
            : "bg-transparent border-white/30"
            }`}
        >
          <Text className={`text-[10px] font-bold uppercase tracking-wider ${isIngredientsOpen ? "text-black" : "text-white"}`}>
            {t("recipe.ingredients")}
          </Text>
          <ArrowUp
            size={16}
            color={isIngredientsOpen ? "black" : "white"}
            style={{ transform: [{ rotate: isIngredientsOpen ? "180deg" : "0deg" }] }}
          />
        </Pressable>

        <Pressable
          onPress={() => changeStep("next")}
          className="h-16 flex-[2] flex-row items-center justify-center gap-2 rounded-2xl bg-white shadow-lg active:scale-95"
        >
          <Text className="text-lg font-bold text-primary">
            {currentStep === totalSteps - 1 ? t("common.finish") : t("common.next")}
          </Text>
          <CaretRight size={24} color="#334d43" weight="bold" />
        </Pressable>
      </View>

      {/* Chef Chat Overlay */}
      {isChatOpen && (
        <View className="absolute inset-0 z-[60]">
          <ChefChat
            recipe={recipe}
            currentStepIndex={currentStep}
            onClose={() => setIsChatOpen(false)}
          />
        </View>
      )}

      {/* Timer Control Modal */}
      <Modal
        visible={selectedTimerIndex !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedTimerIndex(null)}
      >
        <BlurView intensity={20} tint="dark" className="flex-1 items-center justify-center bg-black/40">
          <Pressable className="absolute inset-0" onPress={() => setSelectedTimerIndex(null)} />

          {selectedTimer && (
            <Animated.View
              entering={ZoomIn}
              exiting={ZoomOut}
              className="w-[80%] overflow-hidden rounded-3xl bg-surface-elevated p-6 shadow-2xl"
            >
              <View className="mb-6 flex-row items-center justify-between">
                <Text className="font-playfair text-xl font-bold text-foreground-heading">
                  {selectedTimer.label}
                </Text>
                <Pressable onPress={() => setSelectedTimerIndex(null)} className="rounded-full bg-surface-texture-light p-2">
                  <X size={20} color="#78716c" />
                </Pressable>
              </View>

              <View className="mb-8 items-center">
                <Text className={`font-mono text-6xl font-medium ${selectedTimer.isRunning ? "text-primary" : "text-foreground-heading"}`}>
                  {formatTime(selectedTimer.timeLeft)}
                </Text>
                <Text className="mt-2 text-sm uppercase tracking-widest text-foreground-muted">
                  {selectedTimer.isRunning ? t("recipe.cookingMode.timerRunning") : t("recipe.cookingMode.timerPaused")}
                </Text>
              </View>

              <View className="flex-row justify-center gap-6">
                <Pressable
                  onPress={() => resetTimer(selectedTimer.stepIndex)}
                  className="h-16 w-16 items-center justify-center rounded-full bg-surface-texture-dark active:scale-90"
                >
                  <ArrowCounterClockwise size={24} color="#78716c" />
                </Pressable>

                <Pressable
                  onPress={() => toggleTimer(selectedTimer.stepIndex)}
                  className={`h-20 w-20 items-center justify-center rounded-full shadow-lg active:scale-90 ${selectedTimer.isRunning ? "bg-orange-100" : "bg-primary"
                    }`}
                >
                  {selectedTimer.isRunning ? (
                    <Pause size={32} color="#ea580c" weight="fill" />
                  ) : (
                    <Play size={32} color="white" weight="fill" />
                  )}
                </Pressable>

                <Pressable
                  onPress={() => stopTimer(selectedTimer.stepIndex)}
                  className="h-16 w-16 items-center justify-center rounded-full bg-red-50 active:scale-90"
                >
                  <Trash size={24} color="#ef4444" />
                </Pressable>
              </View>
            </Animated.View>
          )}
        </BlurView>
      </Modal>
    </View>
  );
};
