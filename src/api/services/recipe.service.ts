/**
 * Recipe service
 */
import { api } from "../api-client";
import type { Recipe } from "@/types/recipe";

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
  getRecipes: async (): Promise<Recipe[]> => {
    const response = await api.get<Recipe[]>("/recipes");
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
};
