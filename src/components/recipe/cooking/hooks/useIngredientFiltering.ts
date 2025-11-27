import { useMemo } from "react";
import type { Recipe, Ingredient, Instruction } from "@/types/recipe";

export const useIngredientFiltering = (
  recipe: Recipe,
  step: Instruction | undefined
) => {
  // Ingredients Logic - Memoize expensive filtering and grouping computation
  const allGroupedIngredients = useMemo(() => {
    // Defensive checks
    if (!step || !recipe.ingredients || !Array.isArray(recipe.ingredients)) {
      return {} as Record<string, (Ingredient & { isRelevant: boolean })[]>;
    }

    const stepText = ((step.description || "") + " " + (step.title || "")).toLowerCase();

    // Annotate with relevance
    const annotated = recipe.ingredients
      .filter((ing) => ing && ing.name) // Filter out invalid ingredients
      .map((ing) => {
        const firstWord = ing.name.toLowerCase().split(" ")[0] || "";
        const isRelevant = stepText.includes(firstWord);
        return { ...ing, isRelevant };
      });

    return annotated.reduce(
      (acc, ing) => {
        const group = (ing as any).group || "Main";
        if (!acc[group]) acc[group] = [];
        acc[group].push(ing);
        return acc;
      },
      {} as Record<string, (Ingredient & { isRelevant: boolean })[]>
    );
  }, [recipe.ingredients, step]);

  return {
    allGroupedIngredients,
  };
};
