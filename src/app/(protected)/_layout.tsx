/**
 * Protected Group Layout
 * Routes for fully authenticated users (onboarding completed)
 * Includes tabs, recipe details, extraction, search, settings
 *
 * Also manages the extraction widget for background extractions.
 */
import { Stack, useRouter } from "expo-router";
import { ExtractionProvider, useExtraction } from "@/contexts/ExtractionContext";
import { ExtractionWidget } from "@/components/extraction/ExtractionWidget";

/**
 * Inner component that uses the extraction context
 */
function ProtectedContent() {
  const router = useRouter();
  const { minimizedJobs, expandJob, hasMinimizedJobs } = useExtraction();

  /**
   * Handle widget tap - expand job and navigate to preview
   * The preview screen handles both in-progress and completed states,
   * showing either progress or the recipe with save/discard options.
   */
  const handleExpandJob = (jobId: string) => {
    const job = minimizedJobs.find((j) => j.id === jobId);
    if (!job) return;

    // Mark as expanded
    expandJob(jobId);

    // Always go to preview - it handles all states appropriately
    // (progress for in-progress, recipe with save/discard for completed)
    router.push({
      pathname: "/extraction/preview",
      params: { jobId },
    });
  };

  return (
    <>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen
          name="search"
          options={{
            presentation: "transparentModal",
            animation: "fade",
            animationDuration: 200,
          }}
        />
        <Stack.Screen
          name="extraction"
          options={{
            presentation: "fullScreenModal",
            animation: "fade_from_bottom",
            animationDuration: 350,
          }}
        />
        <Stack.Screen name="settings" />
        <Stack.Screen name="recipe" />
        <Stack.Screen name="discovery" />
      </Stack>

      {/* Extraction widget for minimized jobs */}
      {hasMinimizedJobs && (
        <ExtractionWidget jobs={minimizedJobs} onExpand={handleExpandJob} />
      )}
    </>
  );
}

export default function ProtectedLayout() {
  return (
    <ExtractionProvider>
      <ProtectedContent />
    </ExtractionProvider>
  );
}
