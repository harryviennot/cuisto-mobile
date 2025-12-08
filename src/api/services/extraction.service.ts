/**
 * Recipe extraction service
 */
import { api } from "../api-client";
import type {
  ExtractionJob,
  ImageExtractionResponse,
  RecipeSaveResponse,
  SaveRecipeRequest,
  SourceType,
} from "@/types/extraction";

export interface SubmitExtractionRequest {
  source_type: SourceType;
  source_url?: string;
  text_content?: string;
  file_url?: string;
}

export const extractionService = {
  /**
   * Submit content for recipe extraction (URL, video, text, etc.)
   *
   * The server will create a draft recipe during extraction.
   * When complete, use the recipe_id from the job to preview and save.
   */
  submit: async (request: SubmitExtractionRequest): Promise<ExtractionJob> => {
    const response = await api.post<ExtractionJob>("/extraction/submit", request);
    return response.data;
  },

  /**
   * Submit images for recipe extraction
   */
  submitImages: async (files: FormData): Promise<ImageExtractionResponse> => {
    const response = await api.post<ImageExtractionResponse>("/extraction/submit-images", files, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  },

  /**
   * Get extraction job status
   */
  getJob: async (jobId: string): Promise<ExtractionJob> => {
    const response = await api.get<ExtractionJob>(`/extraction/jobs/${jobId}`);
    return response.data;
  },

  /**
   * Cancel extraction job
   */
  cancelJob: async (jobId: string): Promise<{ message: string }> => {
    const response = await api.delete<{ message: string }>(`/extraction/jobs/${jobId}`);
    return response.data;
  },

  /**
   * Save a recipe to a collection.
   *
   * This publishes draft recipes (sets is_draft=false) and adds
   * them to the user's collection. For existing public recipes,
   * it just adds them to the collection.
   *
   * @param recipeId - The recipe ID to save (from job.recipe_id)
   * @param options - Optional save options (collectionId, isPublic)
   */
  saveRecipe: async (
    recipeId: string,
    options?: { collectionId?: string; isPublic?: boolean }
  ): Promise<RecipeSaveResponse> => {
    const request: SaveRecipeRequest = {
      recipe_id: recipeId,
      collection_id: options?.collectionId,
      is_public: options?.isPublic,
    };
    const response = await api.post<RecipeSaveResponse>("/recipes/save", request);
    return response.data;
  },
};
