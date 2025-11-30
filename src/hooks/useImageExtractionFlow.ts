/**
 * Hook for managing image extraction flow
 * Encapsulates image picking, confirmation, and submission logic
 */
import { useState } from "react";

import Toast from "react-native-toast-message";
import { useRouter } from "expo-router";
import { useImagePicker, type PickedImage } from "./useImagePicker";
import { useImageExtraction } from "./useImageExtraction";
import type { ExtractionSourceType } from "@/config/extractionMethods";

interface UseImageExtractionFlowReturn {
  selectedImages: PickedImage[];
  isSubmitting: boolean;
  handleSelectMethod: (method: ExtractionSourceType) => Promise<PickedImage[] | null>;
  handleConfirm: (images: PickedImage[]) => Promise<void>;
  handleAddMore: (method: ExtractionSourceType) => Promise<PickedImage[] | null>;
  resetSelection: () => void;
}

export function useImageExtractionFlow(maxImages: number = 3): UseImageExtractionFlowReturn {
  const router = useRouter();
  const { pickImages } = useImagePicker();
  const { submitImages, isSubmitting } = useImageExtraction();
  const [selectedImages, setSelectedImages] = useState<PickedImage[]>([]);

  const handleSelectMethod = async (
    method: ExtractionSourceType
  ): Promise<PickedImage[] | null> => {
    const images = await pickImages(method as "camera" | "gallery", {
      maxImages,
      allowsMultipleSelection: true,
    });

    if (images && images.length > 0) {
      setSelectedImages(images);
    }

    return images;
  };

  const handleConfirm = async (images: PickedImage[]) => {
    console.log("[useImageExtractionFlow] handleConfirm called with", images.length, "images");

    try {
      console.log("[useImageExtractionFlow] Calling submitImages...");
      const response = await submitImages(images);
      console.log("[useImageExtractionFlow] submitImages response:", response);

      if (response && response.job_id) {
        console.log("[useImageExtractionFlow] Navigating to preview with job_id:", response.job_id);
        // Navigate to unified recipe preview screen (handles extraction + preview)
        router.push({
          pathname: "/extraction/preview",
          params: { jobId: response.job_id },
        });
        // Reset selection after successful submission
        setSelectedImages([]);
      } else {
        console.error(
          "[useImageExtractionFlow] No response or job_id from submitImages:",
          response
        );
        Toast.show({
          type: "error",
          text1: "Error",
          text2: "Failed to submit images for extraction. Please try again.",
        });
      }
    } catch (err) {
      console.error("[useImageExtractionFlow] Error in handleConfirm:", err);
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "An unexpected error occurred. Please try again.",
      });
    }
  };

  const handleAddMore = async (method: ExtractionSourceType): Promise<PickedImage[] | null> => {
    // Calculate how many more images can be added
    const remainingSlots = maxImages - selectedImages.length;

    const images = await pickImages(method as "camera" | "gallery", {
      maxImages: remainingSlots,
      allowsMultipleSelection: true,
    });

    return images;
  };

  const resetSelection = () => {
    setSelectedImages([]);
  };

  return {
    selectedImages,
    isSubmitting,
    handleSelectMethod,
    handleConfirm,
    handleAddMore,
    resetSelection,
  };
}
