/**
 * Unified recipe preview screen
 * Handles extraction progress and recipe display in a single view
 * Accepts jobId as parameter, polls for completion, then shows recipe with animations
 */
import { useState } from "react";
import { View, Text, Pressable, ActivityIndicator, Alert } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";
import { CheckCircle, X, ArrowCounterClockwise } from "phosphor-react-native";
import { useTranslation } from "react-i18next";
import { useQueryClient } from "@tanstack/react-query";
import { recipeService } from "@/api/services/recipe.service";
import { useExtractionJob } from "@/hooks/useExtractionJob";
import { ExtractionProgress } from "@/components/extraction/ExtractionProgress";
import { ExtractionStatus } from "@/types/extraction";
import type { Recipe } from "@/types/recipe";
import { RecipeDetail } from "@/components/recipe/RecipeDetail";

export default function UnifiedRecipePreviewScreen() {
  const { t } = useTranslation();
  const { jobId } = useLocalSearchParams<{ jobId: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const [recipe, setRecipe] = useState<Recipe | null>(null);

  // Monitor extraction job with SSE and polling fallback
  const {
    job,
    error: jobError,
    retry: retryConnection,
  } = useExtractionJob({
    jobId: jobId || "",
    onComplete: async (job) => {
      if (job.status === ExtractionStatus.COMPLETED && job.recipe_id) {
        // Fetch the recipe
        await loadRecipe(job.recipe_id);
      }
    },
    onError: (error) => {
      // Log error but don't alert user for temporary network issues
      console.warn("Connection error (will retry):", error.message);
    },
    enableSSE: true, // Re-enabled with fixes - test carefully
  });

  const loadRecipe = async (recipeId: string) => {
    try {
      const data = await recipeService.getRecipe(recipeId);
      setRecipe(data);
    } catch (error) {
      console.error("Error loading recipe:", error);
      Alert.alert(t("common.error"), t("recipe.failedToLoad"));
    }
  };

  const handleRetry = () => {
    setRecipe(null);
    retryConnection();
  };

  const handleSave = () => {
    if (!recipe) return;

    // Navigate immediately for instant feedback
    router.replace("/");

    // Invalidate recipes query in background to refresh home page
    queryClient.invalidateQueries({ queryKey: ["recipes"] });
  };

  const handleDiscard = () => {
    // Navigate immediately for instant feedback
    router.replace("/");

    // Delete recipe in background
    if (job?.recipe_id) {
      recipeService.deleteRecipe(job.recipe_id).catch((error) => {
        console.error("Error discarding recipe:", error);
      });
    }
  };

  // Validate jobId
  if (!jobId) {
    return (
      <View className="flex-1 items-center justify-center bg-surface">
        <Text className="text-red-600">{t("recipe.invalidJob")}</Text>
      </View>
    );
  }

  // Error state with retry option
  if (job?.status === ExtractionStatus.FAILED) {
    return (
      <View className="flex-1 bg-surface" style={{ paddingTop: insets.top }}>
        <View className="flex-1 items-center justify-center px-6">
          <Animated.View entering={FadeIn.delay(200)} className="items-center">
            <View className="mb-4 h-16 w-16 items-center justify-center rounded-full bg-state-error/10">
              <X size={32} color="#ef4444" weight="bold" />
            </View>
            <Text className="mb-2 text-center text-xl font-semibold text-state-error">
              {t("errors.extractionFailed")}
            </Text>
            <Text className="mb-6 text-center text-foreground-secondary">
              {job.error_message || t("errors.extractionError")}
            </Text>
            <Pressable
              onPress={handleRetry}
              className="flex-row items-center gap-2 rounded-xl bg-primary px-6 py-3 active:bg-primary-hover"
            >
              <ArrowCounterClockwise size={20} color="#FFFFFF" weight="bold" />
              <Text className="text-base font-semibold text-white">{t("common.tryAgain")}</Text>
            </Pressable>
          </Animated.View>
        </View>
      </View>
    );
  }

  // Connection error state (only shown after multiple consecutive failures)
  if (jobError && !job) {
    return (
      <View className="flex-1 bg-surface" style={{ paddingTop: insets.top }}>
        <View className="flex-1 items-center justify-center px-6">
          <Animated.View entering={FadeIn.delay(200)} className="items-center">
            <View className="mb-4 h-16 w-16 items-center justify-center rounded-full bg-state-warning/10">
              <X size={32} color="#f59e0b" weight="bold" />
            </View>
            <Text className="mb-2 text-center text-xl font-semibold text-state-warning">
              {t("errors.connectionIssue")}
            </Text>
            <Text className="mb-6 text-center text-foreground-secondary">
              {t("errors.connectionMessage")}
            </Text>
            <Pressable
              onPress={handleRetry}
              className="flex-row items-center gap-2 rounded-xl bg-primary px-6 py-3 active:bg-primary-hover"
            >
              <ArrowCounterClockwise size={20} color="#FFFFFF" weight="bold" />
              <Text className="text-base font-semibold text-white">{t("common.retry")}</Text>
            </Pressable>
          </Animated.View>
        </View>
      </View>
    );
  }

  // Recipe loaded - show with animations
  if (recipe) {
    return (
      <RecipeDetail
        recipe={recipe}
        onBack={() => {}}
        isDraft={true}
        onDiscard={handleDiscard}
        onSave={handleSave}
      />
    );
  }

  // Loading state - show progress only
  return (
    <View className="flex-1 bg-surface" style={{ paddingTop: insets.top }}>
      {/* Progress indicator with animation */}
      {job && (
        <Animated.View entering={FadeIn} exiting={FadeOut} className="flex-1">
          <ExtractionProgress
            progress={job.progress_percentage ?? 0}
            currentStep={job.current_step}
          />
        </Animated.View>
      )}

      {/* Debug info (optional - only in dev mode) */}
      {__DEV__ && job && (
        <View className="border-t border-border bg-surface-overlay px-4 py-3">
          <Text className="font-mono text-xs text-foreground-secondary">
            Status: {job.status} | Progress: {job.progress_percentage}% | Job ID: {jobId}
          </Text>
        </View>
      )}
    </View>
  );
}
