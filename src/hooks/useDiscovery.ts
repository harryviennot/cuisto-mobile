/**
 * Custom hooks for discovery features on the home page
 */
import { useEffect } from "react";
import { useQuery, useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
import { discoveryService } from "@/api/services/discovery.service";
import type { Recipe } from "@/types/recipe";
import { TrendingRecipe, ExtractedRecipe, DISCOVERY_CONSTANTS } from "@/types/discovery";

const { SECTION_PREVIEW_LIMIT, RECENT_PAGE_SIZE } = DISCOVERY_CONSTANTS;

// Stale times for different query types
const STALE_TIMES = {
  trending: 5 * 60 * 1000, // 5 minutes - changes frequently
  extracted: 10 * 60 * 1000, // 10 minutes - less volatile
  rated: 15 * 60 * 1000, // 15 minutes - ratings change slowly
  recent: 2 * 60 * 1000, // 2 minutes - new recipes come in
};

/**
 * Hook for fetching trending recipes (most cooked this week)
 */
export function useTrendingRecipes(limit: number = SECTION_PREVIEW_LIMIT) {
  return useQuery<TrendingRecipe[], Error>({
    queryKey: ["discovery", "trending", limit],
    queryFn: () => discoveryService.getTrendingThisWeek(limit),
    staleTime: STALE_TIMES.trending,
    gcTime: 10 * 60 * 1000,
  });
}

/**
 * Hook for fetching trending on socials (most extracted from video sources)
 */
export function useTrendingOnSocials(limit: number = SECTION_PREVIEW_LIMIT) {
  return useQuery<ExtractedRecipe[], Error>({
    queryKey: ["discovery", "socials", limit],
    queryFn: () => discoveryService.getTrendingOnSocials(limit),
    staleTime: STALE_TIMES.extracted,
    gcTime: 15 * 60 * 1000,
  });
}

/**
 * Hook for fetching popular recipes online (most extracted from website sources)
 */
export function usePopularOnline(limit: number = SECTION_PREVIEW_LIMIT) {
  return useQuery<ExtractedRecipe[], Error>({
    queryKey: ["discovery", "online", limit],
    queryFn: () => discoveryService.getPopularOnline(limit),
    staleTime: STALE_TIMES.extracted,
    gcTime: 15 * 60 * 1000,
  });
}

/**
 * Hook for fetching highest rated recipes
 */
export function useHighestRated(limit: number = SECTION_PREVIEW_LIMIT) {
  return useQuery<Recipe[], Error>({
    queryKey: ["discovery", "rated", limit],
    queryFn: () => discoveryService.getHighestRated(limit),
    staleTime: STALE_TIMES.rated,
    gcTime: 20 * 60 * 1000,
  });
}

/**
 * Hook for fetching recently added recipes with infinite scroll
 */
export function useRecentRecipes() {
  return useInfiniteQuery<Recipe[], Error>({
    queryKey: ["discovery", "recent"],
    queryFn: async ({ pageParam = 0 }) => {
      const offset = pageParam as number;
      return discoveryService.getRecentlyAdded(RECENT_PAGE_SIZE, offset);
    },
    getNextPageParam: (lastPage, allPages) => {
      if (lastPage.length < RECENT_PAGE_SIZE) {
        return undefined;
      }
      return allPages.length * RECENT_PAGE_SIZE;
    },
    initialPageParam: 0,
    staleTime: STALE_TIMES.recent,
    gcTime: 10 * 60 * 1000,
  });
}

/**
 * Combined hook for all discovery data on the home page
 * Fetches all sections in parallel
 */
export function useDiscovery() {
  const trending = useTrendingRecipes();
  const socials = useTrendingOnSocials();
  const online = usePopularOnline();
  const rated = useHighestRated();
  const recent = useRecentRecipes();

  // Flatten recent pages into a single array
  const recentRecipes = recent.data?.pages.flat() ?? [];

  // Check if any section is still loading initially (use || so loading stays true until ALL finish)
  const isInitialLoading =
    trending.isLoading || socials.isLoading || online.isLoading || rated.isLoading || recent.isLoading;

  // Refetch all sections
  const refetchAll = async () => {
    await Promise.all([
      trending.refetch(),
      socials.refetch(),
      online.refetch(),
      rated.refetch(),
      recent.refetch(),
    ]);
  };

  // Check if any section is refetching
  const isRefetching =
    trending.isRefetching ||
    socials.isRefetching ||
    online.isRefetching ||
    rated.isRefetching ||
    recent.isRefetching;

  return {
    // Individual section data
    trending: {
      data: trending.data,
      isLoading: trending.isLoading,
      isError: trending.isError,
    },
    socials: {
      data: socials.data,
      isLoading: socials.isLoading,
      isError: socials.isError,
    },
    online: {
      data: online.data,
      isLoading: online.isLoading,
      isError: online.isError,
    },
    rated: {
      data: rated.data,
      isLoading: rated.isLoading,
      isError: rated.isError,
    },

    // Recently added (infinite scroll)
    recent: {
      data: recentRecipes,
      isLoading: recent.isLoading,
      isError: recent.isError,
      fetchNextPage: recent.fetchNextPage,
      hasNextPage: recent.hasNextPage,
      isFetchingNextPage: recent.isFetchingNextPage,
    },

    // Combined states
    isInitialLoading,
    isRefetching,
    refetchAll,
  };
}

/**
 * Hook to prefetch discovery data in the background
 * Use this during onboarding so data is ready when user finishes
 */
export function usePrefetchDiscovery() {
  const queryClient = useQueryClient();

  useEffect(() => {
    // Prefetch all discovery sections in parallel
    // These will be cached and ready when the home page loads
    const prefetch = async () => {
      await Promise.all([
        queryClient.prefetchQuery({
          queryKey: ["discovery", "trending", SECTION_PREVIEW_LIMIT],
          queryFn: () => discoveryService.getTrendingThisWeek(SECTION_PREVIEW_LIMIT),
          staleTime: STALE_TIMES.trending,
        }),
        queryClient.prefetchQuery({
          queryKey: ["discovery", "socials", SECTION_PREVIEW_LIMIT],
          queryFn: () => discoveryService.getTrendingOnSocials(SECTION_PREVIEW_LIMIT),
          staleTime: STALE_TIMES.extracted,
        }),
        queryClient.prefetchQuery({
          queryKey: ["discovery", "online", SECTION_PREVIEW_LIMIT],
          queryFn: () => discoveryService.getPopularOnline(SECTION_PREVIEW_LIMIT),
          staleTime: STALE_TIMES.extracted,
        }),
        queryClient.prefetchQuery({
          queryKey: ["discovery", "rated", SECTION_PREVIEW_LIMIT],
          queryFn: () => discoveryService.getHighestRated(SECTION_PREVIEW_LIMIT),
          staleTime: STALE_TIMES.rated,
        }),
        queryClient.prefetchInfiniteQuery({
          queryKey: ["discovery", "recent"],
          queryFn: () => discoveryService.getRecentlyAdded(RECENT_PAGE_SIZE, 0),
          staleTime: STALE_TIMES.recent,
          initialPageParam: 0,
        }),
      ]);
    };

    prefetch();
  }, [queryClient]);
}
