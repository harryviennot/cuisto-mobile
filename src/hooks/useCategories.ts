/**
 * Hook for fetching and managing categories
 */
import { useQuery } from "@tanstack/react-query";
import { categoryService } from "@/api/services/category.service";
import type { Category } from "@/types/recipe";

// Categories rarely change, cache for a long time
const STALE_TIME = 60 * 60 * 1000; // 1 hour
const GC_TIME = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Hook for fetching all categories
 * Categories are static data that rarely changes, so we use a long stale time
 */
export function useCategories() {
  return useQuery<Category[], Error>({
    queryKey: ["categories"],
    queryFn: () => categoryService.getCategories(),
    staleTime: STALE_TIME,
    gcTime: GC_TIME,
  });
}
