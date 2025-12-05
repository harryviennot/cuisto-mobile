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
import type {
  CookingHistoryEvent,
  MarkCookedParams,
  UpdateCookingEventParams,
} from "@/types/cookingHistory";
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
      // Use refetchType: 'all' to ensure both active and inactive queries are invalidated
      queryClient.invalidateQueries({
        queryKey: [COOKING_HISTORY_KEY],
        refetchType: "all",
      });

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

/**
 * Hook for updating a cooking event
 *
 * Includes cache invalidation for all cooking history queries
 */
export function useUpdateCookingEvent() {
  const queryClient = useQueryClient();

  return useMutation<
    CookingHistoryEvent,
    Error,
    { eventId: string; params: UpdateCookingEventParams }
  >({
    mutationFn: async ({ eventId, params }) => {
      return recipeService.updateCookingEvent(eventId, params);
    },
    onSuccess: () => {
      // Invalidate all cooking history queries to refetch with updated data
      queryClient.invalidateQueries({
        queryKey: [COOKING_HISTORY_KEY],
        refetchType: "all",
      });
    },
  });
}

/**
 * Hook for deleting a cooking event
 *
 * Uses optimistic updates to immediately remove the event from cache
 * without showing the refresh indicator to the user.
 */
export function useDeleteCookingEvent() {
  const queryClient = useQueryClient();

  return useMutation<
    { message: string },
    Error,
    { eventId: string; recipeId: string },
    {
      previousPreview: CookingHistoryEvent[] | undefined;
      previousFull: { pages: CookingHistoryEvent[][] } | undefined;
      recipeId: string;
    }
  >({
    mutationFn: async ({ eventId }) => {
      return recipeService.deleteCookingEvent(eventId);
    },
    onMutate: async (variables) => {
      const { eventId, recipeId } = variables;

      // Cancel any outgoing refetches to avoid overwriting optimistic update
      await queryClient.cancelQueries({ queryKey: [COOKING_HISTORY_KEY] });

      // Snapshot previous values for rollback
      const previousPreview = queryClient.getQueryData<CookingHistoryEvent[]>(
        [COOKING_HISTORY_KEY, "preview", 10]
      );
      const previousFull = queryClient.getQueryData<{ pages: CookingHistoryEvent[][] }>(
        [COOKING_HISTORY_KEY, "full", 365]
      );

      // Optimistically remove event from preview cache
      queryClient.setQueryData<CookingHistoryEvent[]>(
        [COOKING_HISTORY_KEY, "preview", 10],
        (old) => old?.filter((e) => e.event_id !== eventId)
      );

      // Optimistically remove event from full cache (infinite query)
      queryClient.setQueriesData<{ pages: CookingHistoryEvent[][]; pageParams: number[] }>(
        { queryKey: [COOKING_HISTORY_KEY, "full"] },
        (old) => {
          if (!old) return old;
          return {
            ...old,
            pages: old.pages.map((page) =>
              page.filter((e) => e.event_id !== eventId)
            ),
          };
        }
      );

      // Optimistically update recipe times_cooked
      queryClient.setQueryData<Recipe>(["recipe", recipeId], (old) => {
        if (!old) return old;
        return {
          ...old,
          total_times_cooked: Math.max(0, old.total_times_cooked - 1),
          user_data: {
            ...old.user_data,
            times_cooked: Math.max(0, (old.user_data?.times_cooked ?? 1) - 1),
            is_favorite: old.user_data?.is_favorite ?? false,
          },
        };
      });

      // Optimistically update recipes list cache
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
                      total_times_cooked: Math.max(0, recipe.total_times_cooked - 1),
                      user_data: {
                        ...recipe.user_data,
                        times_cooked: Math.max(0, (recipe.user_data?.times_cooked ?? 1) - 1),
                        is_favorite: recipe.user_data?.is_favorite ?? false,
                      },
                    }
                  : recipe
              )
            ),
          };
        }
      );

      // Return context for rollback
      return { previousPreview, previousFull, recipeId };
    },
    onError: (_err, variables, context) => {
      // Rollback on error
      if (context?.previousPreview) {
        queryClient.setQueryData(
          [COOKING_HISTORY_KEY, "preview", 10],
          context.previousPreview
        );
      }
      if (context?.previousFull) {
        queryClient.setQueryData(
          [COOKING_HISTORY_KEY, "full", 365],
          context.previousFull
        );
      }
      // Invalidate to refetch correct state
      queryClient.invalidateQueries({ queryKey: [COOKING_HISTORY_KEY] });
      queryClient.invalidateQueries({ queryKey: ["recipe", variables.recipeId] });
      queryClient.invalidateQueries({ queryKey: ["recipes"] });
    },
    // No onSuccess needed - optimistic update already applied
  });
}
