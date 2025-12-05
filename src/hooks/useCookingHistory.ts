/**
 * Custom hooks for cooking history
 *
 * Provides hooks for fetching and managing cooking history data
 * with React Query for caching and automatic refetching.
 */
import {
  useQuery,
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { recipeService } from "@/api/services/recipe.service";
import type { CookingHistoryEvent, MarkCookedParams } from "@/types/cookingHistory";
import type { Recipe } from "@/types/recipe";

const HISTORY_PER_PAGE = 20;
const COOKING_HISTORY_KEY = "cooking-history";

/**
 * Hook for fetching cooking history preview (limited items for horizontal scroll)
 *
 * @param limit - Maximum number of items to fetch (default: 10)
 * @param options - Additional options like enabled
 */
export function useCookingHistoryPreview(
  limit: number = 10,
  options?: { enabled?: boolean }
) {
  return useQuery<CookingHistoryEvent[], Error>({
    queryKey: [COOKING_HISTORY_KEY, "preview", limit],
    queryFn: () => recipeService.getCookingHistory(365, limit, 0),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes cache
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    enabled: options?.enabled ?? true,
  });
}

/**
 * Hook for fetching full cooking history with infinite scroll pagination
 *
 * @param timeWindowDays - Number of days to look back (default: 365)
 * @param options - Additional options like enabled
 */
export function useCookingHistoryInfinite(
  timeWindowDays: number = 365,
  options?: { enabled?: boolean }
) {
  return useInfiniteQuery<CookingHistoryEvent[], Error>({
    queryKey: [COOKING_HISTORY_KEY, "full", timeWindowDays],
    queryFn: async ({ pageParam = 0 }) => {
      const offset = pageParam as number;
      return recipeService.getCookingHistory(timeWindowDays, HISTORY_PER_PAGE, offset);
    },
    getNextPageParam: (lastPage, allPages) => {
      // If the last page has fewer items than the limit, we've reached the end
      if (lastPage.length < HISTORY_PER_PAGE) {
        return undefined;
      }
      // Calculate the next offset
      return allPages.length * HISTORY_PER_PAGE;
    },
    initialPageParam: 0,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    enabled: options?.enabled ?? true,
  });
}

/**
 * Hook for marking a recipe as cooked with optional session data
 *
 * Includes:
 * - Cache invalidation for cooking history
 * - Updates to the recipe's user_data in cache
 */
export function useMarkRecipeAsCooked() {
  const queryClient = useQueryClient();

  return useMutation<
    { message: string },
    Error,
    { recipeId: string; params?: MarkCookedParams }
  >({
    mutationFn: async ({ recipeId, params }) => {
      return recipeService.markRecipeAsCooked(recipeId, params);
    },
    onSuccess: (_, variables) => {
      const { recipeId, params } = variables;

      // Invalidate cooking history queries to refetch with new event
      queryClient.invalidateQueries({ queryKey: [COOKING_HISTORY_KEY] });

      // Update the recipe's user_data in cache if we have it
      queryClient.setQueryData<Recipe>(["recipe", recipeId], (old) => {
        if (!old) return old;
        return {
          ...old,
          total_times_cooked: old.total_times_cooked + 1,
          user_data: {
            ...old.user_data,
            times_cooked: (old.user_data?.times_cooked ?? 0) + 1,
            last_cooked_at: new Date().toISOString(),
            // Update rating if provided
            ...(params?.rating && { rating: params.rating }),
            is_favorite: old.user_data?.is_favorite ?? false,
          },
        };
      });

      // Also update in the recipes list cache
      queryClient.setQueriesData<{ pages: Recipe[][]; pageParams: number[] }>(
        { queryKey: ["recipes"] },
        (old) => {
          if (!old) return old;
          return {
            ...old,
            pages: old.pages.map((page) =>
              page.map((recipe) =>
                recipe.id === recipeId
                  ? {
                      ...recipe,
                      total_times_cooked: recipe.total_times_cooked + 1,
                      user_data: {
                        ...recipe.user_data,
                        times_cooked: (recipe.user_data?.times_cooked ?? 0) + 1,
                        last_cooked_at: new Date().toISOString(),
                        ...(params?.rating && { rating: params.rating }),
                        is_favorite: recipe.user_data?.is_favorite ?? false,
                      },
                    }
                  : recipe
              )
            ),
          };
        }
      );
    },
  });
}

/**
 * Get cooking history query key for external cache manipulation
 */
export function getCookingHistoryQueryKey(
  type: "preview" | "full",
  param?: number
) {
  if (type === "preview") {
    return [COOKING_HISTORY_KEY, "preview", param ?? 10];
  }
  return [COOKING_HISTORY_KEY, "full", param ?? 365];
}
