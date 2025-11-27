/**
 * Recipe service
 */
import { api } from "../api-client";
import type {
  Recipe,
  RecipeTimingsUpdateRequest,
  RecipeTimingsUpdateResponse,
} from "@/types/recipe";

export const recipeService = {
  /**
   * Get a recipe by ID
   */
  getRecipe: async (recipeId: string): Promise<Recipe> => {
    const response = await api.get<Recipe>(`/recipes/${recipeId}`);
    return response.data;
  },

  /**
   * Get all recipes for the current user
   */
  getRecipes: async (limit: number = 20, offset: number = 0): Promise<Recipe[]> => {
    const response = await api.get<Recipe[]>("/recipes", {
      params: { limit, offset },
    });
    return response.data;
  },

  /**
   * Get paginated recipes for the current user
   */
  getRecipesPaginated: async (limit: number = 20, offset: number = 0): Promise<Recipe[]> => {
    const response = await api.get<Recipe[]>(`/recipes/user/my-recipes`, {
      params: { limit, offset },
    });
    return response.data;
  },

  /**
   * Create a new recipe
   */
  createRecipe: async (recipe: Partial<Recipe>): Promise<Recipe> => {
    const response = await api.post<Recipe>("/recipes", recipe);
    return response.data;
  },

  /**
   * Update a recipe
   */
  updateRecipe: async (recipeId: string, recipe: Partial<Recipe>): Promise<Recipe> => {
    const response = await api.put<Recipe>(`/recipes/${recipeId}`, recipe);
    return response.data;
  },

  /**
   * Delete a recipe
   */
  deleteRecipe: async (recipeId: string): Promise<{ message: string }> => {
    const response = await api.delete<{ message: string }>(`/recipes/${recipeId}`);
    return response.data;
  },

  /**
   * Search recipes with natural language query
   * Uses PostgreSQL full-text search with language-aware stemming
   *
   * @param query - Search query (e.g., "chicken pasta", "quick dinner")
   * @param limit - Maximum number of results (default: 20)
   * @param offset - Pagination offset (default: 0)
   * @returns Array of matching recipes sorted by relevance
   */
  searchRecipes: async (
    query: string,
    limit: number = 20,
    offset: number = 0
  ): Promise<Recipe[]> => {
    const response = await api.get<Recipe[]>("/recipes/search", {
      params: { q: query, limit, offset },
    });
    return response.data;
  },

  /**
   * Update recipe rating with half-star precision
   * @param recipeId - The recipe ID
   * @param rating - Rating value (must be 0.5, 1.0, 1.5, ..., 5.0)
   * @returns Complete updated recipe with new rating and aggregate statistics
   */
  updateRecipeRating: async (
    recipeId: string,
    rating: number
  ): Promise<Recipe> => {
    const response = await api.patch<Recipe>(
      `/recipes/${recipeId}/rating`,
      { rating }
    );
    return response.data;
  },

  /**
   * Update recipe timings with smart ownership logic
   * - If you own the recipe: Updates the base recipe (visible to all users)
   * - If you don't own it: Updates your personal custom timings (only you see them)
   *
   * @param recipeId - The recipe ID
   * @param timings - Prep and/or cook time in minutes
   * @returns Updated timing information and ownership indicator
   */
  updateRecipeTimings: async (
    recipeId: string,
    timings: RecipeTimingsUpdateRequest
  ): Promise<RecipeTimingsUpdateResponse> => {
    const response = await api.patch<RecipeTimingsUpdateResponse>(
      `/recipes/${recipeId}/timings`,
      timings
    );
    return response.data;
  },

  /**
   * Mark a recipe as cooked (increments cooked count)
   * Updates the user's times_cooked counter and last_cooked_at timestamp
   *
   * @param recipeId - The recipe ID
   * @returns Success message
   */
  markRecipeAsCooked: async (recipeId: string): Promise<{ message: string }> => {
    const response = await api.post<{ message: string }>(
      `/recipes/${recipeId}/cooked`
    );
    return response.data;
  },
};
