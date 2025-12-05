/**
 * useCollections Hook
 *
 * React Query hooks for managing virtual collections.
 *
 * Virtual collections system:
 * - "extracted" = user_recipe_data WHERE was_extracted = true
 * - "saved" = user_recipe_data WHERE is_favorite = true
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { collectionService } from "@/api/services/collection.service";
import type { CollectionCountsResponse, CollectionWithRecipes } from "@/types/collection";

const COLLECTIONS_KEY = "collections";

/**
 * Hook to fetch recipe counts for system collections
 * Lightweight query that only fetches counts, not full collection data
 */
export function useCollectionCounts() {
  return useQuery<CollectionCountsResponse, Error>({
    queryKey: [COLLECTIONS_KEY, "counts"],
    queryFn: collectionService.getCollectionCounts,
  });
}

/**
 * Hook to fetch a virtual collection by slug with its recipes
 *
 * Supported slugs:
 * - 'extracted': All recipes the user has extracted
 * - 'saved': All recipes the user has favorited
 */
export function useCollectionBySlug(slug: string, limit = 20, offset = 0) {
  return useQuery<CollectionWithRecipes, Error>({
    queryKey: [COLLECTIONS_KEY, "by-slug", slug, { limit, offset }],
    queryFn: () => collectionService.getCollectionBySlug(slug, limit, offset),
    enabled: !!slug,
  });
}

/**
 * Hook to favorite a recipe
 * Sets is_favorite=true in user_recipe_data
 */
export function useFavoriteRecipe() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (recipeId: string) => collectionService.favoriteRecipe(recipeId),
    onSuccess: () => {
      // Invalidate collection counts and saved collection
      queryClient.invalidateQueries({ queryKey: [COLLECTIONS_KEY, "counts"] });
      queryClient.invalidateQueries({ queryKey: [COLLECTIONS_KEY, "by-slug", "saved"] });
    },
  });
}

/**
 * Hook to unfavorite a recipe
 * Sets is_favorite=false in user_recipe_data
 */
export function useUnfavoriteRecipe() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (recipeId: string) => collectionService.unfavoriteRecipe(recipeId),
    onSuccess: () => {
      // Invalidate collection counts and saved collection
      queryClient.invalidateQueries({ queryKey: [COLLECTIONS_KEY, "counts"] });
      queryClient.invalidateQueries({ queryKey: [COLLECTIONS_KEY, "by-slug", "saved"] });
    },
  });
}
