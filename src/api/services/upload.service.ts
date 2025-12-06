/**
 * Upload service for handling file uploads to Supabase Storage
 */
import { Platform } from "react-native";
import { api } from "../api-client";
import type { PickedImage } from "@/hooks/useImagePicker";

// Storage bucket types
export type StorageBucket = "recipe-images" | "cooking-events";

// Upload response from API
export interface UploadResult {
  url: string;
  path: string;
  size: number;
  content_type: string;
}

/**
 * Upload service for handling image uploads
 */
export const uploadService = {
  /**
   * Upload a single image to Supabase Storage
   *
   * @param image - The picked image from useImagePicker
   * @param bucket - Target storage bucket (default: recipe-images)
   * @returns Upload result with URL and path
   */
  uploadImage: async (
    image: PickedImage,
    bucket: StorageBucket = "recipe-images"
  ): Promise<UploadResult> => {
    const formData = new FormData();

    // Handle URI format differences between iOS and Android
    const uri = Platform.OS === "android" ? image.uri : image.uri.replace("file://", "");

    formData.append("file", {
      uri,
      type: image.type,
      name: image.name,
    } as unknown as Blob);

    formData.append("bucket", bucket);

    const response = await api.post<UploadResult>("/upload/image", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    return response.data;
  },

  /**
   * Upload a cooking photo to the cooking-events bucket
   *
   * Convenience method for uploading cooking session photos
   *
   * @param image - The picked image from useImagePicker
   * @returns Upload result with URL and path
   */
  uploadCookingPhoto: async (image: PickedImage): Promise<UploadResult> => {
    return uploadService.uploadImage(image, "cooking-events");
  },
};
