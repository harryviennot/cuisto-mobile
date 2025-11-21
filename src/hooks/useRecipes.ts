/**
 * Custom hook for fetching recipes with infinite scroll pagination
 * Optimized to reduce unnecessary refetches and improve performance
 */
import { useInfiniteQuery } from "@tanstack/react-query";
import { recipeService } from "@/api/services/recipe.service";
import type { Recipe } from "@/types/recipe";

const RECIPES_PER_PAGE = 20;

export function useRecipes() {
  return useInfiniteQuery<Recipe[], Error>({
    queryKey: ["recipes"],
    queryFn: async ({ pageParam = 0 }) => {
      const offset = pageParam as number;
      return recipeService.getRecipesPaginated(RECIPES_PER_PAGE, offset);
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
