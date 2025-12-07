/**
 * Recipe service
 */
import { api } from "../api-client";
import type {
  Recipe,
  RecipeTimingsUpdateRequest,
  RecipeTimingsUpdateResponse,
} from "@/types/recipe";
import type {
  CookingHistoryEvent,
  MarkCookedParams,
  UpdateCookingEventParams,
} from "@/types/cookingHistory";

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
  updateRecipeRating: async (recipeId: string, rating: number): Promise<Recipe> => {
    const response = await api.patch<Recipe>(`/recipes/${recipeId}/rating`, { rating });
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
   * Mark a recipe as cooked with optional session data
   *
   * Creates a cooking event record with optional:
   * - rating: Rating given at this cooking session (0.5-5.0)
   * - imageUrl: URL to a photo taken during cooking
   * - durationMinutes: Actual cooking time in minutes
   *
   * If rating is provided, it also updates the user's current rating for the recipe.
   *
   * @param recipeId - The recipe ID
   * @param params - Optional session data (rating, photo, duration)
   * @returns Success message
   */
  markRecipeAsCooked: async (
    recipeId: string,
    params?: MarkCookedParams
  ): Promise<{ message: string }> => {
    const body = params
      ? {
        rating: params.rating,
        image_url: params.imageUrl,
        duration_minutes: params.durationMinutes,
      }
      : undefined;

    const response = await api.post<{ message: string }>(`/recipes/${recipeId}/cooked`, body);
    return response.data;
  },

  /**
   * Get user's cooking history as individual cooking events
   *
   * Returns each cooking session with:
   * - Recipe info (id, title, image, difficulty)
   * - Per-event data (rating, photo, duration, timestamp)
   * - Aggregate (total times cooked)
   *
   * @param timeWindowDays - Number of days to look back (1-365, default 365)
   * @param limit - Maximum results per page (1-100, default 20)
   * @param offset - Pagination offset (default 0)
   * @returns Array of cooking history events
   */
  getCookingHistory: async (
    timeWindowDays: number = 365,
    limit: number = 20,
    offset: number = 0
  ): Promise<CookingHistoryEvent[]> => {
    const response = await api.get<CookingHistoryEvent[]>("/discovery/cooking-history", {
      params: {
        time_window_days: timeWindowDays,
        limit,
        offset,
      },
    });
    return response.data;
  },

  /**
   * Update a cooking event
   *
   * @param eventId - The cooking event ID
   * @param params - Fields to update (cookedAt, rating, imageUrl)
   * @returns Updated cooking event
   */
  updateCookingEvent: async (
    eventId: string,
    params: UpdateCookingEventParams
  ): Promise<CookingHistoryEvent> => {
    const body = {
      cooked_at: params.cookedAt,
      rating: params.rating,
      image_url: params.imageUrl,
    };

    const response = await api.patch<CookingHistoryEvent>(
      `/recipes/cooking-events/${eventId}`,
      body
    );
    return response.data;
  },

  /**
   * Delete a cooking event
   *
   * @param eventId - The cooking event ID
   * @returns Success message
   */
  deleteCookingEvent: async (eventId: string): Promise<{ message: string }> => {
    const response = await api.delete<{ message: string }>(`/recipes/cooking-events/${eventId}`);
    return response.data;
  },
};
