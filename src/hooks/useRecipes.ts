/**
 * Custom hook for fetching recipes with infinite scroll pagination
 * Optimized to reduce unnecessary refetches and improve performance
 */
import { useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { recipeService } from "@/api/services/recipe.service";
import type {
  Recipe,
  RecipeTimingsUpdateRequest,
  RecipeTimingsUpdateResponse,
  RecipeRatingUpdateResponse,
} from "@/types/recipe";

const RECIPES_PER_PAGE = 20;

export function useRecipes() {
  return useInfiniteQuery<Recipe[], Error>({
    queryKey: ["recipes"],
    queryFn: async ({ pageParam = 0 }) => {
      const offset = pageParam as number;
      return recipeService.getRecipes(RECIPES_PER_PAGE, offset);
    },
    getNextPageParam: (lastPage, allPages) => {
      // If the last page has fewer items than the limit, we've reached the end
      if (lastPage.length < RECIPES_PER_PAGE) {
        return undefined;
      }
      // Calculate the next offset
      const nextOffset = allPages.length * RECIPES_PER_PAGE;
      return nextOffset;
    },
    initialPageParam: 0,
    // Performance optimizations
    staleTime: 5 * 60 * 1000, // 5 minutes - data stays fresh
    gcTime: 10 * 60 * 1000, // 10 minutes cache (formerly cacheTime)
    refetchOnMount: false, // Don't refetch on mount if data is fresh
    refetchOnWindowFocus: false, // Don't refetch when app comes to foreground
    refetchOnReconnect: false, // Don't refetch when network reconnects (manual refresh available)
  });
}

/**
 * Hook for updating recipe rating with optimistic updates
 */
export function useUpdateRecipeRating() {
  const queryClient = useQueryClient();

  return useMutation<
    RecipeRatingUpdateResponse,
    Error,
    { recipeId: string; rating: number },
    { previousRecipe: Recipe | undefined }
  >({
    mutationFn: async ({ recipeId, rating }) => {
      return recipeService.updateRecipeRating(recipeId, rating);
    },
    // Optimistically update the UI before the API call completes
    onMutate: async ({ recipeId, rating }) => {
      // Cancel any outgoing refetches so they don't overwrite our optimistic update
      await queryClient.cancelQueries({ queryKey: ["recipe", recipeId] });

      // Snapshot the previous value
      const previousRecipe = queryClient.getQueryData<Recipe>(["recipe", recipeId]);

      // Optimistically update the user's rating
      queryClient.setQueryData<Recipe>(["recipe", recipeId], (old) => {
        if (!old) return old;
        return {
          ...old,
          user_data: {
            ...old.user_data,
            rating: rating,
            times_cooked: old.user_data?.times_cooked ?? 0,
            is_favorite: old.user_data?.is_favorite ?? false,
          },
        };
      });

      // Return context with the previous value
      return { previousRecipe };
    },
    // If the mutation fails, rollback to the previous value
    onError: (_err, variables, context) => {
      if (context?.previousRecipe) {
        queryClient.setQueryData(["recipe", variables.recipeId], context.previousRecipe);
      }
    },
    onSuccess: (data, variables) => {
      // Update with the real values from the server (including updated average)
      queryClient.setQueryData<Recipe>(["recipe", variables.recipeId], (old) => {
        if (!old) return old;
        return {
          ...old,
          average_rating: data.recipe_average_rating,
          rating_count: data.recipe_rating_count,
          rating_distribution: data.recipe_rating_distribution,
          user_data: {
            ...old.user_data,
            rating: data.user_rating,
            times_cooked: old.user_data?.times_cooked ?? 0,
            is_favorite: old.user_data?.is_favorite ?? false,
          },
        };
      });
    },
  });
}

/**
 * Hook for updating recipe timings with smart ownership logic
 */
export function useUpdateRecipeTimings() {
  const queryClient = useQueryClient();

  return useMutation<
    RecipeTimingsUpdateResponse,
    Error,
    { recipeId: string; timings: RecipeTimingsUpdateRequest },
    { previousRecipe: Recipe | undefined }
  >({
    mutationFn: async ({ recipeId, timings }) => {
      return recipeService.updateRecipeTimings(recipeId, timings);
    },
    // Optimistically update the UI before the API call completes
    onMutate: async ({ recipeId, timings }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ["recipe", recipeId] });

      // Snapshot the previous value
      const previousRecipe = queryClient.getQueryData<Recipe>(["recipe", recipeId]);

      // Optimistically update the timings in user_data (assuming it's a user customization)
      queryClient.setQueryData<Recipe>(["recipe", recipeId], (old) => {
        if (!old) return old;
        return {
          ...old,
          user_data: {
            ...old.user_data,
            custom_prep_time_minutes: timings.prep_time_minutes,
            custom_cook_time_minutes: timings.cook_time_minutes,
            times_cooked: old.user_data?.times_cooked ?? 0,
            is_favorite: old.user_data?.is_favorite ?? false,
          },
        };
      });

      return { previousRecipe };
    },
    // If the mutation fails, rollback
    onError: (_err, variables, context) => {
      if (context?.previousRecipe) {
        queryClient.setQueryData(["recipe", variables.recipeId], context.previousRecipe);
      }
    },
    onSuccess: (data, variables) => {
      // Update with the real values from the server
      queryClient.setQueryData<Recipe>(["recipe", variables.recipeId], (old) => {
        if (!old) return old;

        // If base recipe was updated, update the base timings
        if (data.updated_base_recipe) {
          return {
            ...old,
            timings: {
              prep_time_minutes: data.prep_time_minutes,
              cook_time_minutes: data.cook_time_minutes,
              total_time_minutes: data.total_time_minutes,
            },
          };
        } else {
          // If user customization, update user_data
          return {
            ...old,
            user_data: {
              ...old.user_data,
              custom_prep_time_minutes: data.prep_time_minutes,
              custom_cook_time_minutes: data.cook_time_minutes,
              times_cooked: old.user_data?.times_cooked ?? 0,
              is_favorite: old.user_data?.is_favorite ?? false,
            },
          };
        }
      });
    },
  });
}
