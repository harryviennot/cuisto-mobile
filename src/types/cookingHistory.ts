/**
 * Cooking History types
 *
 * Types for tracking individual cooking sessions with their associated data
 * (rating, photo, duration) as part of the cooking journal feature.
 */
import type { DifficultyLevel } from "./recipe";

/**
 * A single cooking event/session from the user's cooking history
 */
export interface CookingHistoryEvent {
  // Event identification
  event_id: string;
  recipe_id: string;
  recipe_title: string;

  // Recipe info (for display)
  recipe_image_url?: string;
  difficulty?: DifficultyLevel;

  // Per-event data (specific to this cooking session)
  rating?: number; // Rating given at THIS cooking session (0.5-5.0)
  cooking_image_url?: string; // Photo taken during THIS cooking session
  duration_minutes?: number; // Actual cooking time for this session
  cooked_at: string; // ISO timestamp of when this session occurred

  // Aggregates
  times_cooked: number; // Total times user has cooked this recipe
}

/**
 * Parameters for fetching cooking history
 */
export interface CookingHistoryParams {
  time_window_days?: number; // 1-365, default 365
  limit?: number; // 1-100, default 20
  offset?: number; // Pagination offset
}

/**
 * Parameters for marking a recipe as cooked
 */
export interface MarkCookedParams {
  rating?: number; // Optional rating (0.5-5.0)
  imageUrl?: string; // Optional URL to uploaded cooking photo
  durationMinutes?: number; // Optional actual cooking time
}

/**
 * Active cooking session (for timer tracking)
 */
export interface CookingSession {
  recipeId: string;
  recipeTitle: string;
  startedAt: number; // Date.now() timestamp
}

/**
 * Parameters for updating a cooking event
 */
export interface UpdateCookingEventParams {
  cookedAt?: string; // ISO timestamp
  rating?: number; // 0.5-5.0
  imageUrl?: string | null; // null to remove image
}
