import { useState, useCallback } from "react";
import { recipeService } from "@/api/services";
import type { Recipe } from "@/types/recipe";

export function useSearch() {
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<Recipe[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const search = useCallback(async (query: string) => {
    if (query.trim().length === 0) {
      // Clear search
      setSearchResults([]);
      setIsSearching(false);
      setHasSearched(false);
      setError(null);
      return;
    }

    setIsSearching(true);
    setError(null);

    try {
      const results = await recipeService.searchRecipes(query.trim());
      setSearchResults(results);
      setHasSearched(true);
    } catch (err) {
      console.error("Search error:", err);
      setError(err instanceof Error ? err : new Error("Search failed"));
      setSearchResults([]);
      setHasSearched(true);
    } finally {
      setIsSearching(false);
    }
  }, []);

  const clearSearch = useCallback(() => {
    setSearchResults([]);
    setIsSearching(false);
    setHasSearched(false);
    setError(null);
  }, []);

  return {
    isSearching,
    searchResults,
    hasSearched,
    error,
    search,
    clearSearch,
  };
}
