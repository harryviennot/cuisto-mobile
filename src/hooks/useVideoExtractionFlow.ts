/**
 * Hook for managing video extraction flow
 * Encapsulates video URL submission logic
 */
import { useState } from "react";
import Toast from "react-native-toast-message";
import { useRouter } from "expo-router";
import { extractionService } from "@/api/services/extraction.service";
import { SourceType } from "@/types/extraction";

interface UseVideoExtractionFlowReturn {
  isSubmitting: boolean;
  submitVideoUrl: (url: string) => Promise<void>;
}

export function useVideoExtractionFlow(): UseVideoExtractionFlowReturn {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submitVideoUrl = async (url: string) => {
    if (isSubmitting) return;

    setIsSubmitting(true);

    try {
      console.log("[useVideoExtractionFlow] Submitting video URL:", url);

      const response = await extractionService.submit({
        source_type: SourceType.VIDEO,
        source_url: url,
      });

      console.log("[useVideoExtractionFlow] Response:", response);

      if (response && response.id) {
        console.log("[useVideoExtractionFlow] Navigating to preview with job_id:", response.id);
        router.push({
          pathname: "/recipe/preview",
          params: { jobId: response.id },
        });
      } else {
        console.error("[useVideoExtractionFlow] No response or id from submit:", response);
        Toast.show({
          type: "error",
          text1: "Error",
          text2: "Failed to submit video for extraction. Please try again.",
        });
      }
    } catch (err) {
      console.error("[useVideoExtractionFlow] Error submitting video:", err);
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "An unexpected error occurred. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    isSubmitting,
    submitVideoUrl,
  };
}
