/**
 * Unified recipe preview screen
 * Handles extraction progress and recipe display in a single view
 * Accepts jobId as parameter, polls for completion, then shows recipe with animations
 *
 * NEW FLOW (isDraft architecture):
 * 1. Job completes with recipe_id (draft recipe created on server)
 * 2. Preview fetches recipe using recipe_id
 * 3. User clicks "Save" -> calls saveRecipe API to publish and add to collection
 * 4. User clicks "Discard" -> calls delete API to remove draft
 *
 * For duplicate videos:
 * - recipe_id is set to the existing public recipe
 * - User can add the existing recipe to their collection
 */
import { useState, useEffect, useCallback } from "react";
import { View, Text, Pressable } from "react-native";
import Toast from "react-native-toast-message";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";
import { XIcon, ArrowCounterClockwiseIcon, MagnifyingGlassIcon } from "phosphor-react-native";
import { useTranslation } from "react-i18next";
import { useQueryClient } from "@tanstack/react-query";
import { recipeService } from "@/api/services/recipe.service";
import { extractionService } from "@/api/services/extraction.service";
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
  const [isDuplicate, setIsDuplicate] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [recipeId, setRecipeId] = useState<string | null>(null);
  const [initialJobLoaded, setInitialJobLoaded] = useState(false);

  // Monitor extraction job with SSE and polling fallback
  const {
    job,
    error: jobError,
    retry: retryConnection,
  } = useExtractionJob({
    jobId: jobId || "",
    onComplete: async (completedJob) => {
      // Handle completed or duplicate status
      if (completedJob.status === ExtractionStatus.COMPLETED) {
        // Check for existing_recipe_id (duplicate) or recipe_id (new extraction)
        const foundRecipeId = completedJob.existing_recipe_id || completedJob.recipe_id;
        if (foundRecipeId) {
          setRecipeId(foundRecipeId);
          // It's a duplicate if existing_recipe_id is set
          setIsDuplicate(!!completedJob.existing_recipe_id);
        }
      }
    },
    enableSSE: true,
  });

  // Fetch initial job state immediately on mount (backup for SSE race condition)
  useEffect(() => {
    if (!jobId || initialJobLoaded) return;

    const fetchInitialJob = async () => {
      try {
        const initialJob = await extractionService.getJob(jobId);
        setInitialJobLoaded(true);

        // If job is already complete, handle it
        if (initialJob.status === ExtractionStatus.COMPLETED) {
          // Check for existing_recipe_id (duplicate) or recipe_id (new extraction)
          const foundRecipeId = initialJob.existing_recipe_id || initialJob.recipe_id;
          if (foundRecipeId) {
            setRecipeId(foundRecipeId);
            setIsDuplicate(!!initialJob.existing_recipe_id);
          }
        }
      } catch (error) {
        console.warn("[Preview] Failed to fetch initial job state:", error);
      }
    };

    fetchInitialJob();
  }, [jobId, initialJobLoaded]);

  const loadRecipe = useCallback(
    async (id: string) => {
      try {
        const data = await recipeService.getRecipe(id);
        setRecipe(data);
      } catch {
        Toast.show({
          type: "error",
          text1: t("common.error"),
          text2: t("recipe.failedToLoad"),
        });
      }
    },
    [t]
  );

  // Fetch recipe when recipe_id is available
  useEffect(() => {
    if (recipeId) {
      loadRecipe(recipeId);
    }
  }, [recipeId, loadRecipe]);

  const handleRetry = () => {
    setRecipe(null);
    setRecipeId(null);
    setIsDuplicate(false);
    retryConnection();
  };

  /**
   * Save the recipe to collection.
   * This publishes the draft (is_draft=false) and adds to user's collection.
   */
  const handleSave = async () => {
    if (!recipeId) return;

    setIsSaving(true);
    try {
      await extractionService.saveRecipe(recipeId);

      // Navigate to home
      router.replace("/");

      // Invalidate recipes query to refresh home page
      queryClient.invalidateQueries({ queryKey: ["recipes"] });
      queryClient.invalidateQueries({ queryKey: ["collections"] });

      Toast.show({
        type: "success",
        text1: t("common.success"),
        text2: t("recipe.savedSuccessfully"),
      });
    } catch {
      setIsSaving(false);
      Toast.show({
        type: "error",
        text1: t("common.error"),
        text2: t("recipe.failedToSave"),
      });
    }
  };

  /**
   * Discard the draft recipe.
   * For drafts: deletes the recipe from the database.
   * For duplicates: just navigates away (no deletion needed).
   */
  const handleDiscard = async () => {
    // For duplicates, just navigate away
    if (isDuplicate) {
      router.replace("/");
      return;
    }

    // For drafts, delete the recipe
    if (recipeId) {
      setIsDeleting(true);
      try {
        await recipeService.deleteRecipe(recipeId);
      } catch {
        // Silent fail - draft will be auto-cleaned later
        console.warn("Failed to delete draft recipe:", recipeId);
      }
    }

    router.replace("/");
  };

  console.log(job?.progress_percentage);

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
              <XIcon size={32} color="#ef4444" weight="bold" />
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
              <ArrowCounterClockwiseIcon size={20} color="#FFFFFF" weight="bold" />
              <Text className="text-base font-semibold text-white">{t("common.tryAgain")}</Text>
            </Pressable>
          </Animated.View>
        </View>
      </View>
    );
  }

  // Not a recipe state - show friendly message with tips
  if (job?.status === ExtractionStatus.NOT_A_RECIPE) {
    return (
      <View className="flex-1 bg-surface" style={{ paddingTop: insets.top }}>
        <View className="flex-1 items-center justify-center px-6">
          <Animated.View entering={FadeIn.delay(200)} className="items-center">
            <View className="mb-4 h-16 w-16 items-center justify-center rounded-full bg-state-warning/10">
              <MagnifyingGlassIcon size={32} color="#f59e0b" weight="bold" />
            </View>
            <Text className="mb-2 text-center text-xl font-semibold text-foreground">
              {t("errors.notARecipe")}
            </Text>
            <Text className="mb-4 text-center text-foreground-secondary">
              {t("errors.notARecipeMessage")}
            </Text>
            <Text className="mb-6 text-center text-sm text-foreground-secondary opacity-70">
              {t("errors.notARecipeHint")}
            </Text>
            <Pressable
              onPress={() => router.replace("/")}
              className="rounded-xl bg-primary px-6 py-3 active:bg-primary-hover"
            >
              <Text className="text-base font-semibold text-white">{t("common.ok")}</Text>
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
              <XIcon size={32} color="#f59e0b" weight="bold" />
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
              <ArrowCounterClockwiseIcon size={20} color="#FFFFFF" weight="bold" />
              <Text className="text-base font-semibold text-white">{t("common.retry")}</Text>
            </Pressable>
          </Animated.View>
        </View>
      </View>
    );
  }

  // // Duplicate video detected - show existing recipe with option to add to collection
  // if (recipe && isDuplicate) {
  //   return (
  //     <View className="flex-1 bg-surface" style={{ paddingTop: insets.top }}>
  //       {/* Duplicate notice banner */}
  //       <Animated.View
  //         entering={FadeIn.delay(100)}
  //         className="mx-4 mb-4 mt-2 flex-row items-center gap-3 rounded-xl bg-primary/10 p-4"
  //       >
  //         <UsersThreeIcon size={24} color="#6366f1" weight="fill" />
  //         <View className="flex-1">
  //           <Text className="font-semibold text-foreground">Recipe Already Exists</Text>
  //           <Text className="text-sm text-foreground-secondary">
  //             This video was already extracted. Add it to your collection?
  //           </Text>
  //         </View>
  //       </Animated.View>

  //       <RecipeDetail
  //         recipe={recipe}
  //         onBack={handleDiscard}
  //         isDraft={true}
  //         onDiscard={handleDiscard}
  //         onSave={isSaving ? undefined : handleSave}
  //         showHeader={false}
  //       />
  //     </View>
  //   );
  // }

  // Recipe loaded - show with animations
  if (recipe) {
    return (
      <RecipeDetail
        recipe={recipe}
        onBack={() => {}}
        isDraft={true}
        onDiscard={isDeleting ? undefined : handleDiscard}
        onSave={isSaving ? undefined : handleSave}
        showHeader={false}
      />
    );
  }

  // Loading state - show progress (always render with default 0% if job not yet loaded)
  return (
    <View className="flex-1 bg-surface" style={{ paddingTop: insets.top }}>
      {/* Progress indicator - always show, even before first SSE event */}
      <Animated.View entering={FadeIn} exiting={FadeOut} className="flex-1">
        <ExtractionProgress
          progress={job?.progress_percentage ?? 0}
          currentStep={job?.current_step}
        />
      </Animated.View>

      {/* Debug info (optional - only in dev mode) */}
      {__DEV__ && (
        <View className="border-t border-border bg-surface-overlay px-4 py-3">
          <Text className="font-mono text-xs text-foreground-secondary">
            Status: {job?.status ?? "connecting"} | Progress: {job?.progress_percentage ?? 0}% | Job
            ID: {jobId}
          </Text>
        </View>
      )}
    </View>
  );
}
