import { useState, useMemo, useCallback } from "react";
import type { Ingredient } from "@/types/recipe";

/**
 * Hook for managing recipe serving size scaling
 * Handles ingredient amount calculations based on serving adjustments
 */
export function useRecipeScaling(baseServings: number, initialServings?: number) {
  const [servings, setServings] = useState(initialServings || baseServings);

  /**
   * Calculate scaling factor for ingredient amounts
   */
  const scalingFactor = useMemo(() => {
    if (!baseServings || baseServings === 0) return 1;
    return servings / baseServings;
  }, [servings, baseServings]);

  /**
   * Scale an ingredient's quantity based on current servings
   * Returns a formatted string for display
   */
  const scaleIngredientAmount = useCallback(
    (ingredient: Ingredient): string | undefined => {
      if (ingredient.quantity == null) return undefined;

      const scaledAmount = ingredient.quantity * scalingFactor;

      // Format the number nicely
      if (scaledAmount % 1 === 0) {
        return scaledAmount.toString();
      }

      // Round to reasonable precision
      const rounded = Math.round(scaledAmount * 4) / 4;

      // Convert to fraction if it's a common one
      const fractionMap: Record<number, string> = {
        0.25: "¼",
        0.5: "½",
        0.75: "¾",
        0.333: "⅓",
        0.667: "⅔",
      };

      const decimal = rounded % 1;
      const whole = Math.floor(rounded);

      if (fractionMap[decimal]) {
        return whole > 0 ? `${whole} ${fractionMap[decimal]}` : fractionMap[decimal];
      }

      return rounded.toFixed(2).replace(/\.?0+$/, "");
    },
    [scalingFactor]
  );

  /**
   * Scale all ingredients in a list, returning new quantity as a number
   */
  const scaleIngredients = useCallback(
    (ingredients: Ingredient[]): Ingredient[] => {
      return ingredients.map((ingredient) => ({
        ...ingredient,
        quantity: ingredient.quantity != null
          ? ingredient.quantity * scalingFactor
          : ingredient.quantity,
      }));
    },
    [scalingFactor]
  );

  /**
   * Increment servings by 1
   */
  const incrementServings = useCallback(() => {
    setServings((prev) => Math.min(prev + 1, 50)); // Cap at 50 servings
  }, []);

  /**
   * Decrement servings by 1
   */
  const decrementServings = useCallback(() => {
    setServings((prev) => Math.max(prev - 1, 1)); // Minimum 1 serving
  }, []);

  /**
   * Reset servings to base amount
   */
  const resetServings = useCallback(() => {
    setServings(baseServings);
  }, [baseServings]);

  return {
    servings,
    setServings,
    scalingFactor,
    scaleIngredientAmount,
    scaleIngredients,
    incrementServings,
    decrementServings,
    resetServings,
    isScaled: servings !== baseServings,
  };
}
