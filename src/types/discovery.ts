/**
 * Discovery types for home page discovery features
 */
import type { Recipe } from "./recipe";

/**
 * Source category for filtering extracted recipes
 */
export type SourceCategory = "video" | "website";

/**
 * Cooking statistics for trending recipes
 */
export interface CookingStats {
  cook_count: number;
  unique_users: number;
  time_window_days: number;
}

/**
 * Extraction statistics for most extracted recipes
 */
export interface ExtractionStats {
  extraction_count: number;
  unique_extractors: number;
}

/**
 * Trending recipe with cooking statistics
 */
export interface TrendingRecipe extends Recipe {
  cooking_stats: CookingStats;
}

/**
 * Most extracted recipe with extraction statistics
 */
export interface ExtractedRecipe extends Recipe {
  extraction_stats: ExtractionStats;
}

/**
 * Discovery section types
 */
export type DiscoverySectionType = "trending" | "socials" | "online" | "rated";

/**
 * Discovery section metadata
 */
export interface DiscoverySection {
  id: DiscoverySectionType;
  title: string;
  type: DiscoverySectionType;
  recipes: Recipe[];
  isLoading: boolean;
  isError: boolean;
  hasEnoughData: boolean;
}

/**
 * Constants for discovery
 */
export const DISCOVERY_CONSTANTS = {
  /** Minimum recipes to show a section */
  MIN_SECTION_RECIPES: 3,
  /** Max recipes in horizontal scroll preview */
  SECTION_PREVIEW_LIMIT: 5,
  /** Pagination size for infinite grid */
  RECENT_PAGE_SIZE: 20,
} as const;
