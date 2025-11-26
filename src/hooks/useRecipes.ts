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
import Toast from "react-native-toast-message";

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
      Toast.show({
        type: "error",
        text1: "There was an error updating the recipe rating",
        text2: _err.message,
      });
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
      Toast.show({
        type: "error",
        text1: "Error updating recipe timings",
        text2: _err.message,
      });
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

/**
 * Hook for updating a recipe's core data (title, description, metadata, etc.)
 * Includes optimistic updates for immediate UI feedback
 */
export function useUpdateRecipe() {
  const queryClient = useQueryClient();

  return useMutation<
    Recipe,
    Error,
    { recipeId: string; data: Partial<Recipe> },
    { previousRecipe: Recipe | undefined; previousRecipesList: any }
  >({
    mutationFn: async ({ recipeId, data }) => {
      return recipeService.updateRecipe(recipeId, data);
    },
    // Optimistically update the UI before the API call completes
    onMutate: async ({ recipeId, data }) => {
      // Cancel any outgoing refetches so they don't overwrite our optimistic update
      await queryClient.cancelQueries({ queryKey: ["recipe", recipeId] });
      await queryClient.cancelQueries({ queryKey: ["recipes"] });

      // Snapshot the previous values
      const previousRecipe = queryClient.getQueryData<Recipe>(["recipe", recipeId]);
      const previousRecipesList = queryClient.getQueryData(["recipes"]);

      // Optimistically update the individual recipe query
      queryClient.setQueryData<Recipe>(["recipe", recipeId], (old) => {
        if (!old) return old;
        return { ...old, ...data, updated_at: new Date().toISOString() };
      });

      // Optimistically update the recipe in the recipes list
      queryClient.setQueriesData<{ pages: Recipe[][]; pageParams: any[] }>(
        { queryKey: ["recipes"] },
        (old) => {
          if (!old) return old;
          return {
            ...old,
            pages: old.pages.map((page) =>
              page.map((recipe) =>
                recipe.id === recipeId
                  ? { ...recipe, ...data, updated_at: new Date().toISOString() }
                  : recipe
              )
            ),
          };
        }
      );

      return { previousRecipe, previousRecipesList };
    },
    // If the mutation fails, rollback to the previous values
    onError: (_err, variables, context) => {
      Toast.show({
        type: "error",
        text1: "Error updating recipe",
        text2: _err.message,
      });
      if (context?.previousRecipe) {
        queryClient.setQueryData(["recipe", variables.recipeId], context.previousRecipe);
      }
      if (context?.previousRecipesList) {
        queryClient.setQueryData(["recipes"], context.previousRecipesList);
      }
    },
    // Update with the real values from the server
    onSuccess: (data, variables) => {
      // Update the individual recipe query with server data
      queryClient.setQueryData<Recipe>(["recipe", variables.recipeId], data);

      // Update the recipe in the recipes list with server data
      queryClient.setQueriesData<{ pages: Recipe[][]; pageParams: any[] }>(
        { queryKey: ["recipes"] },
        (old) => {
          if (!old) return old;
          return {
            ...old,
            pages: old.pages.map((page) =>
              page.map((recipe) =>
                recipe.id === variables.recipeId ? data : recipe
              )
            ),
          };
        }
      );
    },
  });
}

/**
 * Hook for deleting a recipe with cache invalidation
 */
export function useDeleteRecipe() {
  const queryClient = useQueryClient();

  return useMutation<
    { message: string },
    Error,
    string
  >({
    mutationFn: async (recipeId: string) => {
      return recipeService.deleteRecipe(recipeId);
    },
    onSuccess: (_, recipeId) => {
      // Remove the recipe from the cache
      queryClient.removeQueries({ queryKey: ["recipe", recipeId] });
      // Invalidate the recipes list to refetch
      queryClient.invalidateQueries({ queryKey: ["recipes"] });

      Toast.show({
        type: "success",
        text1: "Recipe deleted",
        text2: "The recipe has been deleted successfully",
      });
    },
    onError: (error) => {
      Toast.show({
        type: "error",
        text1: "Error deleting recipe",
        text2: error.message,
      });
    },
  });
}
