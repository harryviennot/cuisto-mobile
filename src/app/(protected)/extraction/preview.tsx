/**
 * Unified recipe preview screen
 * Handles extraction progress and recipe display in a single view
 * Accepts jobId as parameter, uses context for job state, then shows recipe with animations
 *
 * NEW FLOW (isDraft architecture):
 * 1. Job completes with recipe_id (draft recipe created on server)
 * 2. Preview fetches recipe using recipe_id
 * 3. User clicks "Save" -> shows privacy prompt for private sources (photo/paste/voice)
 * 4. User chooses public/private -> saves in background and navigates immediately
 * 5. User clicks "Discard" -> calls delete API to remove draft
 *
 * MINIMIZE FEATURE:
 * - User can tap minimize button (top-right) during extraction
 * - Job continues in background with SSE managed by ExtractionContext
 * - Widget appears above tab bar showing progress
 * - Tapping widget returns to this screen
 *
 * For duplicate videos:
 * - recipe_id is set to the existing public recipe
 * - User can add the existing recipe to their collection
 */
import { useState, useEffect, useCallback, useRef } from "react";
import { View, Text, Pressable } from "react-native";
import Toast from "react-native-toast-message";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";
import {
  XIcon,
  ArrowCounterClockwiseIcon,
  MagnifyingGlassIcon,
  LockIcon,
  GlobeIcon,
  LockSimpleIcon,
  MinusIcon,
} from "phosphor-react-native";
import { useTranslation } from "react-i18next";
import { useQueryClient } from "@tanstack/react-query";
import { BottomSheetModal } from "@gorhom/bottom-sheet";
import { recipeService } from "@/api/services/recipe.service";
import { extractionService } from "@/api/services/extraction.service";
import { useExtraction } from "@/contexts/ExtractionContext";
import { ExtractionProgress } from "@/components/extraction/ExtractionProgress";
import { ExtractionStatus, SourceType } from "@/types/extraction";
import type { Recipe } from "@/types/recipe";
import { RecipeDetail } from "@/components/recipe/RecipeDetail";
import { PremiumBottomSheet } from "@/components/ui/PremiumBottomSheet";

/**
 * Check if source type requires privacy prompt (private/personal content)
 */
function isPrivateSourceType(sourceType?: string): boolean {
  return (
    sourceType === SourceType.PHOTO ||
    sourceType === SourceType.PASTE ||
    sourceType === SourceType.VOICE
  );
}

export default function UnifiedRecipePreviewScreen() {
  const { t } = useTranslation();
  const {
    jobId,
    recipeId: passedRecipeId,
    isCompleted,
  } = useLocalSearchParams<{
    jobId: string;
    recipeId?: string;
    isCompleted?: string;
  }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [isDuplicate, setIsDuplicate] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  // Initialize recipeId from URL params if provided (for completed jobs from widget)
  const [recipeId, setRecipeId] = useState<string | null>(passedRecipeId || null);
  const [initialJobLoaded, setInitialJobLoaded] = useState(isCompleted === "true");

  // Privacy bottom sheet state
  const privacySheetRef = useRef<BottomSheetModal>(null);

  // Use extraction context for job state and minimize functionality
  const { getJob, minimizeJob, cancelJob, dismissJob } = useExtraction();

  // Get job from context
  const job = jobId ? getJob(jobId) : undefined;

  // Fetch initial job state if not in context yet (e.g., returning from widget)
  useEffect(() => {
    if (!jobId || initialJobLoaded || job) return;

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
  }, [jobId, initialJobLoaded, job]);

  // Handle job completion from context (or already completed on mount)
  useEffect(() => {
    if (job?.status === ExtractionStatus.COMPLETED) {
      const foundRecipeId = job.existing_recipe_id || job.recipe_id;
      if (foundRecipeId && foundRecipeId !== recipeId) {
        console.log("[Preview] Job completed, loading recipe:", foundRecipeId);
        setRecipeId(foundRecipeId);
        setIsDuplicate(!!job.existing_recipe_id);
      }
    }
  }, [job, recipeId]); // Use job object to trigger on any job change

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

  /**
   * Handle minimize button press
   * Minimizes the job to the widget and navigates back to tabs
   */
  const handleMinimize = useCallback(() => {
    if (!jobId) return;
    minimizeJob(jobId);
    router.dismissTo("/(protected)/(tabs)");
  }, [jobId, minimizeJob, router]);

  /**
   * Execute the save with the specified privacy setting.
   * Uses optimistic UI - navigates immediately and saves in background.
   */
  const executeSave = useCallback(
    (isPublic: boolean) => {
      if (!recipeId || !jobId) return;

      // Close the privacy sheet if open
      privacySheetRef.current?.dismiss();

      // Dismiss job from context (cleanup SSE/polling)
      dismissJob(jobId);

      // Show success toast immediately (optimistic)
      Toast.show({
        type: "success",
        text1: t("common.success"),
        text2: t("recipe.savedSuccessfully"),
      });

      // Navigate immediately - don't wait for API
      router.dismissTo("/(protected)/(tabs)");

      // Save in background (fire and forget)
      extractionService
        .saveRecipe(recipeId, { isPublic })
        .then(() => {
          // Invalidate queries in background for fresh data
          queryClient.invalidateQueries({ queryKey: ["recipes"] });
          queryClient.invalidateQueries({ queryKey: ["collections", "counts"] });
          queryClient.invalidateQueries({ queryKey: ["collections", "by-slug", "extracted"] });
        })
        .catch(() => {
          // Show error toast if save fails in background
          Toast.show({
            type: "error",
            text1: t("common.error"),
            text2: t("recipe.failedToSave"),
          });
        });
    },
    [recipeId, jobId, dismissJob, router, queryClient, t]
  );

  /**
   * Handle save button press.
   * For private sources (photo/paste/voice): show privacy prompt
   * For public sources (link): save directly as public
   */
  const handleSave = useCallback(() => {
    if (!recipeId) return;

    // Use recipe.source_type since recipe is always loaded when save button is visible
    // Fall back to job.source_type for safety
    const sourceType = recipe?.source_type || job?.source_type;

    // For private sources, show the privacy choice bottom sheet
    if (isPrivateSourceType(sourceType)) {
      privacySheetRef.current?.present();
      return;
    }

    // For public sources (link/video), save directly as public
    setIsSaving(true);
    executeSave(true);
  }, [recipeId, recipe?.source_type, job?.source_type, executeSave]);

  /**
   * Discard the draft recipe.
   * For drafts: deletes the recipe from the database.
   * For duplicates: just navigates away (no deletion needed).
   */
  const handleDiscard = async () => {
    // Dismiss job from context first
    if (jobId) {
      dismissJob(jobId);
    }

    // For duplicates, just navigate away
    if (isDuplicate) {
      router.dismissTo("/(protected)/(tabs)");
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

    router.dismissTo("/(protected)/(tabs)");
  };

  /**
   * Handle cancel button press during extraction
   */
  const handleCancel = async () => {
    if (!jobId) return;
    await cancelJob(jobId);
    // Use dismissTo for safer navigation back to tabs
    router.dismissTo("/(protected)/(tabs)");
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
    // Dismiss job from context on error view render
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
              onPress={() => {
                dismissJob(jobId);
                // Navigate back to tabs first, then push extraction
                router.dismissTo("/(protected)/(tabs)");
                router.push(`/extraction/${job.source_type}`);
              }}
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
              onPress={() => {
                dismissJob(jobId);
                router.dismissTo("/(protected)/(tabs)");
              }}
              className="rounded-xl bg-primary px-6 py-3 active:bg-primary-hover"
            >
              <Text className="text-base font-semibold text-white">{t("common.ok")}</Text>
            </Pressable>
          </Animated.View>
        </View>
      </View>
    );
  }

  // Website blocked state - show friendly message directing to manual paste
  if (job?.status === ExtractionStatus.WEBSITE_BLOCKED) {
    return (
      <View className="flex-1 bg-surface" style={{ paddingTop: insets.top }}>
        <View className="flex-1 items-center justify-center px-6">
          <Animated.View entering={FadeIn.delay(200)} className="items-center">
            <View className="mb-4 h-16 w-16 items-center justify-center rounded-full bg-state-warning/10">
              <LockIcon size={32} color="#f59e0b" weight="bold" />
            </View>
            <Text className="mb-2 text-center text-xl font-semibold text-foreground">
              {t("errors.websiteBlocked")}
            </Text>
            <Text className="mb-6 text-center text-foreground-secondary">
              {t("errors.websiteBlockedMessage")}
            </Text>
            <Pressable
              onPress={() => {
                dismissJob(jobId);
                router.replace("/extraction/text");
              }}
              className="rounded-xl bg-primary px-6 py-3 active:bg-primary-hover"
            >
              <Text className="text-base font-semibold text-white">
                {t("errors.tryManualEntry")}
              </Text>
            </Pressable>
          </Animated.View>
        </View>
      </View>
    );
  }

  // Recipe loaded - show with animations
  if (recipe) {
    return (
      <>
        <RecipeDetail
          recipe={recipe}
          onBack={() => {}}
          isDraft={true}
          onDiscard={isDeleting ? undefined : handleDiscard}
          onSave={isSaving ? undefined : handleSave}
          showHeader={false}
        />

        {/* Privacy Choice Bottom Sheet */}
        <PremiumBottomSheet
          ref={privacySheetRef}
          title={t("extraction.privacy.title")}
          onClose={() => privacySheetRef.current?.dismiss()}
        >
          <View className="px-6 pb-4">
            <Text className="text-foreground-secondary text-base mb-6">
              {t("extraction.privacy.description")}
            </Text>

            {/* Save Publicly Option */}
            <Pressable
              onPress={() => executeSave(true)}
              className="flex-row items-center p-4 rounded-2xl bg-surface-overlay mb-3 active:opacity-80"
            >
              <View className="w-12 h-12 rounded-full bg-primary/10 items-center justify-center mr-4">
                <GlobeIcon size={24} color="#334d43" weight="bold" />
              </View>
              <View className="flex-1">
                <Text className="text-foreground font-semibold text-base">
                  {t("extraction.privacy.publicTitle")}
                </Text>
                <Text className="text-foreground-secondary text-sm mt-0.5">
                  {t("extraction.privacy.publicDesc")}
                </Text>
              </View>
            </Pressable>

            {/* Save Privately Option */}
            <Pressable
              onPress={() => executeSave(false)}
              className="flex-row items-center p-4 rounded-2xl bg-surface-overlay active:opacity-80"
            >
              <View className="w-12 h-12 rounded-full bg-accent/10 items-center justify-center mr-4">
                <LockSimpleIcon size={24} color="#c65d47" weight="bold" />
              </View>
              <View className="flex-1">
                <Text className="text-foreground font-semibold text-base">
                  {t("extraction.privacy.privateTitle")}
                </Text>
                <Text className="text-foreground-secondary text-sm mt-0.5">
                  {t("extraction.privacy.privateDesc")}
                </Text>
              </View>
            </Pressable>
          </View>
        </PremiumBottomSheet>
      </>
    );
  }

  // If we have recipeId but recipe not loaded yet, show recipe loading state
  // (this happens when coming from widget for completed job)
  if (recipeId && !recipe) {
    return (
      <RecipeDetail
        recipe={undefined}
        isLoading={true}
        onBack={() => router.dismissTo("/(protected)/(tabs)")}
        isDraft={true}
        showHeader={false}
      />
    );
  }

  // Loading state - show progress (always render with default 0% if job not yet loaded)
  return (
    <View
      className="flex-1 bg-surface"
      style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}
    >
      {/* Header with minimize button */}
      <View className="flex-row justify-end px-4 py-2">
        <Pressable
          onPress={handleMinimize}
          className="w-10 h-10 rounded-full bg-surface-elevated items-center justify-center active:bg-surface-overlay"
          hitSlop={12}
        >
          <MinusIcon size={20} color="#78716c" weight="bold" />
        </Pressable>
      </View>

      {/* Progress indicator - always show, even before first SSE event */}
      <Animated.View entering={FadeIn} exiting={FadeOut} className="flex-1">
        <ExtractionProgress
          progress={job?.progress_percentage ?? 0}
          currentStep={job?.current_step}
        />
      </Animated.View>

      <View className="items-center justify-center px-6">
        <Pressable
          onPress={handleCancel}
          className="flex-row items-center gap-2 rounded-xl bg-primary px-6 py-3 active:bg-primary-hover"
        >
          <ArrowCounterClockwiseIcon size={20} color="#FFFFFF" weight="bold" />
          <Text className="text-base font-semibold text-white">{t("common.cancel")}</Text>
        </Pressable>
      </View>

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
