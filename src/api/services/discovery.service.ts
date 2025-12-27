/**
 * Discovery service for home page discovery features
 */
import { api } from "../api-client";
import type { Recipe } from "@/types/recipe";
import {
  TrendingRecipe,
  ExtractedRecipe,
  SourceCategory,
  DISCOVERY_CONSTANTS,
} from "@/types/discovery";

const { SECTION_PREVIEW_LIMIT, RECENT_PAGE_SIZE } = DISCOVERY_CONSTANTS;

export const discoveryService = {
  /**
   * Get trending recipes (most cooked this week)
   */
  getTrendingThisWeek: async (
    limit: number = SECTION_PREVIEW_LIMIT,
    offset: number = 0,
    timeWindowDays: number = 7
  ): Promise<TrendingRecipe[]> => {
    const response = await api.get<TrendingRecipe[]>("/discovery/trending", {
      params: {
        time_window_days: timeWindowDays,
        limit,
        offset,
      },
    });
    return response.data;
  },

  /**
   * Get most extracted recipes from video sources (TikTok, Instagram, YouTube)
   * "Trending on Socials"
   */
  getTrendingOnSocials: async (
    limit: number = SECTION_PREVIEW_LIMIT,
    offset: number = 0
  ): Promise<ExtractedRecipe[]> => {
    const response = await api.get<ExtractedRecipe[]>("/discovery/most-extracted", {
      params: {
        source_category: "video" as SourceCategory,
        limit,
        offset,
      },
    });
    return response.data;
  },

  /**
   * Get most extracted recipes from website sources
   * "Popular Recipes Online"
   */
  getPopularOnline: async (
    limit: number = SECTION_PREVIEW_LIMIT,
    offset: number = 0
  ): Promise<ExtractedRecipe[]> => {
    const response = await api.get<ExtractedRecipe[]>("/discovery/most-extracted", {
      params: {
        source_category: "website" as SourceCategory,
        limit,
        offset,
      },
    });
    return response.data;
  },

  /**
   * Get highest rated public recipes
   */
  getHighestRated: async (
    limit: number = SECTION_PREVIEW_LIMIT,
    offset: number = 0,
    minRatingCount: number = 3
  ): Promise<Recipe[]> => {
    const response = await api.get<Recipe[]>("/discovery/highest-rated", {
      params: {
        min_rating_count: minRatingCount,
        limit,
        offset,
      },
    });
    return response.data;
  },

  /**
   * Get recently added public recipes (for infinite scroll grid)
   */
  getRecentlyAdded: async (
    limit: number = RECENT_PAGE_SIZE,
    offset: number = 0
  ): Promise<Recipe[]> => {
    const response = await api.get<Recipe[]>("/discovery/recent", {
      params: { limit, offset },
    });
    return response.data;
  },

  /**
   * Get popular recipes, optionally filtered by category
   * Used for category filtering on homepage
   * Sorted by popularity score: (average_rating * rating_count) + total_times_cooked
   */
  getPopularByCategory: async (
    categoryId: string | null,
    limit: number = RECENT_PAGE_SIZE,
    offset: number = 0
  ): Promise<Recipe[]> => {
    const response = await api.get<Recipe[]>("/discovery/popular", {
      params: {
        category_id: categoryId,
        limit,
        offset,
      },
    });
    return response.data;
  },
};
