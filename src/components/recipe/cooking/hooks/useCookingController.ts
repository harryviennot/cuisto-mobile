import { useState, useEffect, useCallback } from "react";
import { useWindowDimensions } from "react-native";
import {
    useSharedValue,
    withSpring,
    withTiming,
    runOnJS,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { Audio } from "expo-av";
import type { Recipe, Ingredient } from "@/types/recipe";

export interface ActiveTimer {
    stepIndex: number;
    label: string;
    duration: number;
    timeLeft: number;
    isRunning: boolean;
}

export const useCookingController = (recipe: Recipe) => {
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
    const directionAnim = useSharedValue(0); // 1 = forward, -1 = backward

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

    const startTimer = useCallback((stepIndex: number, durationMinutes: number | undefined, title: string) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        const durationSeconds = durationMinutes ? durationMinutes * 60 : 0;
        if (!durationSeconds) return;

        setTimers((prev) => {
            const exists = prev.find((t) => t.stepIndex === stepIndex);
            if (exists) {
                return prev.map((t) => (t.stepIndex === stepIndex ? { ...t, isRunning: !t.isRunning } : t));
            } else {
                return [
                    ...prev,
                    {
                        stepIndex,
                        label: title,
                        duration: durationSeconds,
                        timeLeft: durationSeconds,
                        isRunning: true,
                    },
                ];
            }
        });
    }, []);

    const stopTimer = useCallback((stepIndex: number) => {
        setTimers((prev) => prev.filter((t) => t.stepIndex !== stepIndex));
        if (selectedTimerIndex === stepIndex) setSelectedTimerIndex(null);
    }, [selectedTimerIndex]);

    const resetTimer = useCallback((stepIndex: number) => {
        setTimers((prev) =>
            prev.map((t) =>
                t.stepIndex === stepIndex ? { ...t, timeLeft: t.duration, isRunning: false } : t
            )
        );
    }, []);

    const toggleTimer = useCallback((stepIndex: number) => {
        setTimers((prev) =>
            prev.map((t) => (t.stepIndex === stepIndex ? { ...t, isRunning: !t.isRunning } : t))
        );
    }, []);

    const formatTime = useCallback((seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s < 10 ? "0" : ""}${s}`;
    }, []);

    // Navigation
    const changeStep = useCallback((direction: "next" | "prev") => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

        if (direction === "next") {
            directionAnim.value = 1;
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
            directionAnim.value = -1;
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
    }, [currentStep, totalSteps, slideAnim, nextStepAnim, directionAnim]);

    // Ingredients Logic
    const getAllGroupedIngredients = useCallback(() => {
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
    }, [recipe.ingredients, step]);

    const toggleIngredients = useCallback(() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        if (isIngredientsOpen) {
            ingredientsSheetAnim.value = withTiming(0);
            setIsIngredientsOpen(false);
        } else {
            setIsIngredientsOpen(true);
            ingredientsSheetAnim.value = withSpring(1);
        }
    }, [isIngredientsOpen, ingredientsSheetAnim]);

    return {
        currentStep,
        totalSteps,
        step,
        nextStep,
        instructions,
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
        height,
        directionAnim,
    };
};
