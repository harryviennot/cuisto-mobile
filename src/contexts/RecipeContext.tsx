import React, { createContext, useContext, useState, useCallback, ReactNode } from "react";
import type { Recipe } from "@/types/recipe";

interface RecipeContextState {
  // Current recipe being viewed/edited
  currentRecipe: Recipe | null;

  // User's recipe customizations (ratings, notes, etc.)
  userRecipeData: Map<string, any>;

  // Recently viewed recipes (for quick access)
  recentRecipes: Recipe[];

  // Favorite recipe IDs
  favoriteRecipeIds: Set<string>;

  // Current filters/search
  searchQuery: string;
  selectedCategories: string[];
  selectedTags: string[];
  difficultyFilter: string | null;

  // UI state
  isGridView: boolean;
  sortBy: "newest" | "oldest" | "rating" | "time";
}

interface RecipeContextActions {
  // Recipe management
  setCurrentRecipe: (recipe: Recipe | null) => void;
  updateCurrentRecipe: (updates: Partial<Recipe>) => void;

  // User data management
  setUserRecipeData: (recipeId: string, data: any) => void;
  getUserRecipeData: (recipeId: string) => any;

  // Recent recipes
  addToRecentRecipes: (recipe: Recipe) => void;
  clearRecentRecipes: () => void;

  // Favorites management
  toggleFavorite: (recipeId: string) => void;
  isFavorite: (recipeId: string) => boolean;

  // Search and filters
  setSearchQuery: (query: string) => void;
  toggleCategory: (category: string) => void;
  toggleTag: (tag: string) => void;
  setDifficultyFilter: (difficulty: string | null) => void;
  clearFilters: () => void;

  // UI preferences
  toggleViewMode: () => void;
  setSortBy: (sortBy: RecipeContextState["sortBy"]) => void;
}

interface RecipeContextValue extends RecipeContextState, RecipeContextActions {}

const RecipeContext = createContext<RecipeContextValue | undefined>(undefined);

interface RecipeProviderProps {
  children: ReactNode;
}

export function RecipeProvider({ children }: RecipeProviderProps) {
  // State
  const [currentRecipe, setCurrentRecipe] = useState<Recipe | null>(null);
  const [userRecipeData] = useState<Map<string, any>>(new Map());
  const [recentRecipes, setRecentRecipes] = useState<Recipe[]>([]);
  const [favoriteRecipeIds, setFavoriteRecipeIds] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [difficultyFilter, setDifficultyFilter] = useState<string | null>(null);
  const [isGridView, setIsGridView] = useState(true);
  const [sortBy, setSortBy] = useState<RecipeContextState["sortBy"]>("newest");

  // Recipe management
  const updateCurrentRecipe = useCallback((updates: Partial<Recipe>) => {
    setCurrentRecipe((prev) => {
      if (!prev) return prev;
      return { ...prev, ...updates };
    });
  }, []);

  // User data management
  const setUserRecipeDataCallback = useCallback(
    (recipeId: string, data: any) => {
      userRecipeData.set(recipeId, data);
    },
    [userRecipeData]
  );

  const getUserRecipeDataCallback = useCallback(
    (recipeId: string) => {
      return userRecipeData.get(recipeId);
    },
    [userRecipeData]
  );

  // Recent recipes management
  const addToRecentRecipes = useCallback((recipe: Recipe) => {
    setRecentRecipes((prev) => {
      // Remove if already exists to avoid duplicates
      const filtered = prev.filter((r) => r.id !== recipe.id);
      // Add to beginning and limit to 10 recent recipes
      return [recipe, ...filtered].slice(0, 10);
    });
  }, []);

  const clearRecentRecipes = useCallback(() => {
    setRecentRecipes([]);
  }, []);

  // Favorites management
  const toggleFavorite = useCallback((recipeId: string) => {
    setFavoriteRecipeIds((prev) => {
      const next = new Set(prev);
      if (next.has(recipeId)) {
        next.delete(recipeId);
      } else {
        next.add(recipeId);
      }
      return next;
    });
  }, []);

  const isFavorite = useCallback(
    (recipeId: string) => {
      return favoriteRecipeIds.has(recipeId);
    },
    [favoriteRecipeIds]
  );

  // Filter management
  const toggleCategory = useCallback((category: string) => {
    setSelectedCategories((prev) => {
      if (prev.includes(category)) {
        return prev.filter((c) => c !== category);
      }
      return [...prev, category];
    });
  }, []);

  const toggleTag = useCallback((tag: string) => {
    setSelectedTags((prev) => {
      if (prev.includes(tag)) {
        return prev.filter((t) => t !== tag);
      }
      return [...prev, tag];
    });
  }, []);

  const clearFilters = useCallback(() => {
    setSearchQuery("");
    setSelectedCategories([]);
    setSelectedTags([]);
    setDifficultyFilter(null);
  }, []);

  // UI preferences
  const toggleViewMode = useCallback(() => {
    setIsGridView((prev) => !prev);
  }, []);

  const value: RecipeContextValue = {
    // State
    currentRecipe,
    userRecipeData,
    recentRecipes,
    favoriteRecipeIds,
    searchQuery,
    selectedCategories,
    selectedTags,
    difficultyFilter,
    isGridView,
    sortBy,

    // Actions
    setCurrentRecipe,
    updateCurrentRecipe,
    setUserRecipeData: setUserRecipeDataCallback,
    getUserRecipeData: getUserRecipeDataCallback,
    addToRecentRecipes,
    clearRecentRecipes,
    toggleFavorite,
    isFavorite,
    setSearchQuery,
    toggleCategory,
    toggleTag,
    setDifficultyFilter,
    clearFilters,
    toggleViewMode,
    setSortBy,
  };

  return <RecipeContext.Provider value={value}>{children}</RecipeContext.Provider>;
}

/**
 * Hook to use the Recipe context
 */
export function useRecipeContext() {
  const context = useContext(RecipeContext);
  if (!context) {
    throw new Error("useRecipeContext must be used within a RecipeProvider");
  }
  return context;
}

/**
 * Hook to get just the current recipe
 */
export function useCurrentRecipe() {
  const { currentRecipe, setCurrentRecipe, updateCurrentRecipe } = useRecipeContext();
  return { currentRecipe, setCurrentRecipe, updateCurrentRecipe };
}

/**
 * Hook to manage recipe favorites
 */
export function useRecipeFavorites() {
  const { favoriteRecipeIds, toggleFavorite, isFavorite } = useRecipeContext();
  return { favoriteRecipeIds, toggleFavorite, isFavorite };
}

/**
 * Hook to manage recipe filters
 */
export function useRecipeFilters() {
  const {
    searchQuery,
    selectedCategories,
    selectedTags,
    difficultyFilter,
    setSearchQuery,
    toggleCategory,
    toggleTag,
    setDifficultyFilter,
    clearFilters,
  } = useRecipeContext();

  return {
    searchQuery,
    selectedCategories,
    selectedTags,
    difficultyFilter,
    setSearchQuery,
    toggleCategory,
    toggleTag,
    setDifficultyFilter,
    clearFilters,
    hasActiveFilters:
      searchQuery || selectedCategories.length > 0 || selectedTags.length > 0 || difficultyFilter,
  };
}
