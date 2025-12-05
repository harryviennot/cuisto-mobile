/**
 * Collections service
 *
 * Virtual collections system:
 * - "extracted" = user_recipe_data WHERE was_extracted = true
 * - "saved" = user_recipe_data WHERE is_favorite = true
 */
import { api } from "../api-client";
import type {
  CollectionCountsResponse,
  CollectionWithRecipes,
} from "@/types/collection";
import type { RecipeSaveResponse } from "@/types/extraction";

export const collectionService = {
  /**
   * Get recipe counts for system collections
   * Lightweight endpoint for UI updates without full collection data
   */
  getCollectionCounts: async (): Promise<CollectionCountsResponse> => {
    const response = await api.get<CollectionCountsResponse>("/collections/counts");
    return response.data;
  },

  /**
   * Get a virtual collection by slug with its recipes
   *
   * Supported slugs:
   * - 'extracted': All recipes the user has extracted
   * - 'saved': All recipes the user has favorited
   */
  getCollectionBySlug: async (
    slug: string,
    limit = 20,
    offset = 0
  ): Promise<CollectionWithRecipes> => {
    const response = await api.get<CollectionWithRecipes>(`/collections/by-slug/${slug}`, {
      params: { limit, offset },
    });
    return response.data;
  },

  /**
   * Add a recipe to user's favorites
   * Sets is_favorite=true in user_recipe_data
   */
  favoriteRecipe: async (recipeId: string): Promise<RecipeSaveResponse> => {
    const response = await api.post<RecipeSaveResponse>(`/recipes/${recipeId}/favorite`);
    return response.data;
  },

  /**
   * Remove a recipe from user's favorites
   * Sets is_favorite=false in user_recipe_data
   */
  unfavoriteRecipe: async (recipeId: string): Promise<void> => {
    await api.delete(`/recipes/${recipeId}/favorite`);
  },
};
