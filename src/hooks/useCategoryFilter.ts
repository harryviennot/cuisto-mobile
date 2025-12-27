/**
 * Hook for category-filtered recipe list with infinite scroll
 * Used on the homepage when a category is selected
 */
import { useState, useCallback, useMemo } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { discoveryService } from "@/api/services/discovery.service";
import type { Recipe } from "@/types/recipe";
import { DISCOVERY_CONSTANTS } from "@/types/discovery";

const { RECENT_PAGE_SIZE } = DISCOVERY_CONSTANTS;

// Stale time for category-filtered results
const STALE_TIME = 2 * 60 * 1000; // 2 minutes
const GC_TIME = 10 * 60 * 1000; // 10 minutes

/**
 * Hook for managing category filtering on the homepage
 *
 * When a category is selected, fetches popular recipes from that category
 * with infinite scroll support.
 *
 * When no category is selected (null), the hook is disabled and the
 * homepage shows the default discovery sections.
 */
export function useCategoryFilter() {
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);

  const query = useInfiniteQuery<Recipe[], Error>({
    queryKey: ["discovery", "popular", selectedCategoryId],
    queryFn: async ({ pageParam = 0 }) => {
      const offset = pageParam as number;
      return discoveryService.getPopularByCategory(
        selectedCategoryId,
        RECENT_PAGE_SIZE,
        offset
      );
    },
    getNextPageParam: (lastPage, allPages) => {
      if (lastPage.length < RECENT_PAGE_SIZE) {
        return undefined;
      }
      return allPages.length * RECENT_PAGE_SIZE;
    },
    initialPageParam: 0,
    staleTime: STALE_TIME,
    gcTime: GC_TIME,
    // Only fetch when a category is selected
    enabled: selectedCategoryId !== null,
  });

  // Flatten pages into a single array
  const recipes = useMemo(() => {
    return query.data?.pages.flat() ?? [];
  }, [query.data]);

  // Select a category (or null for "All")
  const selectCategory = useCallback((categoryId: string | null) => {
    setSelectedCategoryId(categoryId);
  }, []);

  // Clear the filter (same as selecting "All")
  const clearFilter = useCallback(() => {
    setSelectedCategoryId(null);
  }, []);

  return {
    // Current state
    selectedCategoryId,
    isFiltering: selectedCategoryId !== null,

    // Actions
    selectCategory,
    clearFilter,

    // Query results (for filtered recipes)
    recipes,
    isLoading: query.isLoading,
    isError: query.isError,
    fetchNextPage: query.fetchNextPage,
    hasNextPage: query.hasNextPage,
    isFetchingNextPage: query.isFetchingNextPage,
    refetch: query.refetch,
  };
}
