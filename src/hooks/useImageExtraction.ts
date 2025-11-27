/**
 * Image extraction hook
 */
import { useState } from "react";
import { Platform } from "react-native";
import { extractionService } from "@/api/services/extraction.service";
import type { PickedImage } from "./useImagePicker";
import type { ImageExtractionResponse } from "@/types/extraction";

export function useImageExtraction() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const submitImages = async (images: PickedImage[]): Promise<ImageExtractionResponse | null> => {
    setIsSubmitting(true);
    setError(null);

    try {
      console.log("[useImageExtraction] Starting image submission with", images.length, "images");
      const formData = new FormData();

      // Append each image to FormData
      images.forEach((image, index) => {
        const file: any = {
          uri: Platform.OS === "android" ? image.uri : image.uri.replace("file://", ""),
          type: image.type,
          name: image.name,
        };
        console.log(`[useImageExtraction] Adding image ${index}:`, file.name, file.type);
        formData.append("files", file);
      });

      console.log("[useImageExtraction] Calling extractionService.submitImages...");
      const response = await extractionService.submitImages(formData);
      console.log("[useImageExtraction] Response received:", response);
      return response;
    } catch (err) {
      console.error("[useImageExtraction] Error submitting images:", err);
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      return null;
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    submitImages,
    isSubmitting,
    error,
  };
}
