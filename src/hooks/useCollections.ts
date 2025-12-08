/**
 * useCollections Hook
 *
 * React Query hooks for managing virtual collections.
 *
 * Virtual collections system:
 * - "extracted" = user_recipe_data WHERE was_extracted = true
 * - "saved" = user_recipe_data WHERE is_favorite = true
 */

import { useQuery, useMutation, useQueryClient, InfiniteData } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import Toast from "react-native-toast-message";
import { collectionService } from "@/api/services/collection.service";
import type { CollectionCountsResponse, CollectionWithRecipes } from "@/types/collection";
import type { Recipe } from "@/types/recipe";

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

/**
 * Context type for rollback on error
 */
interface ToggleFavoriteContext {
  previousRecipe: Recipe | undefined;
  previousRecipes: InfiniteData<Recipe[]> | undefined;
  previousSavedCollections: [readonly unknown[], CollectionWithRecipes | undefined][];
  previousCounts: CollectionCountsResponse | undefined;
  previousDiscoveryQueries: [readonly unknown[], unknown][];
}

/**
 * Hook to toggle favorite status with optimistic updates
 * Provides instant UI feedback while the API request happens in the background
 */
export function useToggleFavorite() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  return useMutation<void, Error, { recipeId: string; isFavorite: boolean }, ToggleFavoriteContext>(
    {
      mutationFn: async ({ recipeId, isFavorite }) => {
        if (isFavorite) {
          await collectionService.unfavoriteRecipe(recipeId);
        } else {
          await collectionService.favoriteRecipe(recipeId);
        }
      },

      onMutate: async ({ recipeId, isFavorite }) => {
        // 1. Cancel any outgoing refetches to prevent overwriting optimistic update
        await queryClient.cancelQueries({ queryKey: ["recipe", recipeId] });
        await queryClient.cancelQueries({ queryKey: ["recipes"] });
        await queryClient.cancelQueries({ queryKey: [COLLECTIONS_KEY, "by-slug", "saved"] });
        await queryClient.cancelQueries({ queryKey: [COLLECTIONS_KEY, "counts"] });
        await queryClient.cancelQueries({ queryKey: ["discovery"] });

        // 2. Snapshot previous values for rollback
        const previousRecipe = queryClient.getQueryData<Recipe>(["recipe", recipeId]);
        const previousRecipes = queryClient.getQueryData<InfiniteData<Recipe[]>>(["recipes"]);
        const previousCounts = queryClient.getQueryData<CollectionCountsResponse>([
          COLLECTIONS_KEY,
          "counts",
        ]);

        // Snapshot all saved collection queries (there could be multiple with different pagination)
        const savedCollectionQueries = queryClient.getQueriesData<CollectionWithRecipes>({
          queryKey: [COLLECTIONS_KEY, "by-slug", "saved"],
        });
        const previousSavedCollections = savedCollectionQueries.map(
          ([key, data]) => [key, data] as [readonly unknown[], CollectionWithRecipes | undefined]
        );

        // Snapshot all discovery queries for rollback
        const discoveryQueries = queryClient.getQueriesData({ queryKey: ["discovery"] });
        const previousDiscoveryQueries = discoveryQueries.map(
          ([key, data]) => [key, data] as [readonly unknown[], unknown]
        );

        // 3. Optimistically update individual recipe cache
        queryClient.setQueryData<Recipe>(["recipe", recipeId], (old) => {
          if (!old) return old;
          return {
            ...old,
            user_data: {
              ...old.user_data,
              is_favorite: !isFavorite,
              times_cooked: old.user_data?.times_cooked ?? 0,
            },
          };
        });

        // 4. Optimistically update recipes list (infinite query)
        queryClient.setQueriesData<InfiniteData<Recipe[]>>({ queryKey: ["recipes"] }, (old) => {
          if (!old) return old;
          return {
            ...old,
            pages: old.pages.map((page) =>
              page.map((recipe) =>
                recipe.id === recipeId
                  ? {
                      ...recipe,
                      user_data: {
                        ...recipe.user_data,
                        is_favorite: !isFavorite,
                        times_cooked: recipe.user_data?.times_cooked ?? 0,
                      },
                    }
                  : recipe
              )
            ),
          };
        });

        // 5. Optimistically update saved collection (remove recipe if unfavoriting)
        if (isFavorite) {
          // Removing from favorites - filter out the recipe
          queryClient.setQueriesData<CollectionWithRecipes>(
            { queryKey: [COLLECTIONS_KEY, "by-slug", "saved"] },
            (old) => {
              if (!old) return old;
              return {
                ...old,
                recipes: old.recipes.filter((r) => r.id !== recipeId),
                total_count: Math.max(0, old.total_count - 1),
                collection: {
                  ...old.collection,
                  recipe_count: Math.max(0, old.collection.recipe_count - 1),
                },
              };
            }
          );
        }

        // 6. Optimistically update collection counts
        queryClient.setQueryData<CollectionCountsResponse>([COLLECTIONS_KEY, "counts"], (old) => {
          if (!old) return old;
          return {
            ...old,
            saved: isFavorite ? Math.max(0, old.saved - 1) : old.saved + 1,
          };
        });

        // 7. Optimistically update discovery queries (both regular and infinite)
        // Helper to update recipe in an array
        const updateRecipeInArray = (recipes: Recipe[]): Recipe[] =>
          recipes.map((recipe) =>
            recipe.id === recipeId
              ? {
                  ...recipe,
                  user_data: {
                    ...recipe.user_data,
                    is_favorite: !isFavorite,
                    times_cooked: recipe.user_data?.times_cooked ?? 0,
                  },
                }
              : recipe
          );

        // Update all discovery queries (handles both array and infinite query formats)
        queryClient.setQueriesData({ queryKey: ["discovery"] }, (old: unknown) => {
          if (!old) return old;
          // Handle infinite query format (has pages array)
          if (typeof old === "object" && old !== null && "pages" in old) {
            const infiniteData = old as InfiniteData<Recipe[]>;
            return {
              ...infiniteData,
              pages: infiniteData.pages.map(updateRecipeInArray),
            };
          }
          // Handle regular array format
          if (Array.isArray(old)) {
            return updateRecipeInArray(old as Recipe[]);
          }
          return old;
        });

        return { previousRecipe, previousRecipes, previousSavedCollections, previousCounts, previousDiscoveryQueries };
      },

      onError: (_err, { recipeId }, context) => {
        // Rollback to previous state
        if (context?.previousRecipe) {
          queryClient.setQueryData(["recipe", recipeId], context.previousRecipe);
        }
        if (context?.previousRecipes) {
          queryClient.setQueryData(["recipes"], context.previousRecipes);
        }
        // Rollback saved collections
        if (context?.previousSavedCollections) {
          for (const [key, data] of context.previousSavedCollections) {
            queryClient.setQueryData(key, data);
          }
        }
        // Rollback counts
        if (context?.previousCounts) {
          queryClient.setQueryData([COLLECTIONS_KEY, "counts"], context.previousCounts);
        }
        // Rollback discovery queries
        if (context?.previousDiscoveryQueries) {
          for (const [key, data] of context.previousDiscoveryQueries) {
            queryClient.setQueryData(key, data);
          }
        }
        Toast.show({ type: "error", text1: t("recipe.bookmark.error") });
      },

      onSuccess: (_, { isFavorite }) => {
        Toast.show({
          type: "success",
          text1: isFavorite ? t("recipe.bookmark.removed") : t("recipe.bookmark.added"),
        });
        // Refetch to ensure server state is synced (but UI already updated)
        queryClient.invalidateQueries({ queryKey: [COLLECTIONS_KEY, "counts"] });
        queryClient.invalidateQueries({ queryKey: [COLLECTIONS_KEY, "by-slug", "saved"] });
      },
    }
  );
}
