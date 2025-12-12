/**
 * Translation service for recipe translations
 */
import { api } from "../api-client";
import type { Recipe } from "@/types/recipe";

export interface AvailableLanguagesResponse {
  /** Original recipe language (ISO 639-1) */
  original: string;
  /** List of cached translation languages */
  translations: string[];
  /** Combined list of all available languages (original + translations) */
  available: string[];
}

export const translationService = {
  /**
   * Translate a recipe to a target language
   *
   * If a cached translation exists, returns immediately.
   * Otherwise, generates a new translation using AI and caches it.
   *
   * @param recipeId - The recipe ID
   * @param targetLanguage - ISO 639-1 language code (e.g., 'en', 'fr', 'es')
   * @returns Recipe with content in target language
   */
  translateRecipe: async (recipeId: string, targetLanguage: string): Promise<Recipe> => {
    const response = await api.post<Recipe>(
      `/recipes/${recipeId}/translate?target_language=${targetLanguage}`
    );
    return response.data;
  },

  /**
   * Get available languages for a recipe
   *
   * @param recipeId - The recipe ID
   * @returns Original language and available translation languages
   */
  getAvailableLanguages: async (recipeId: string): Promise<AvailableLanguagesResponse> => {
    const response = await api.get<AvailableLanguagesResponse>(`/recipes/${recipeId}/languages`);
    return response.data;
  },

  /**
   * Delete cached translations for a recipe
   *
   * @param recipeId - The recipe ID
   * @param language - Optional specific language to delete (if not provided, deletes all)
   * @returns Success message
   */
  deleteTranslations: async (
    recipeId: string,
    language?: string
  ): Promise<{ message: string }> => {
    const params = language ? `?language=${language}` : "";
    const response = await api.delete<{ message: string }>(
      `/recipes/${recipeId}/translations${params}`
    );
    return response.data;
  },
};
