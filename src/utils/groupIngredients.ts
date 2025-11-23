import type { Ingredient } from "@/types/recipe";

/**
 * Groups ingredients by their group field
 * Ingredients without a group are assigned to "Main"
 *
 * @param ingredients - Array of ingredients to group
 * @returns Object with group names as keys and arrays of ingredients as values
 */
export function groupIngredients(ingredients: Ingredient[]): Record<string, Ingredient[]> {
  return ingredients.reduce(
    (acc, ing) => {
      const group = ing.group || "Main";
      if (!acc[group]) acc[group] = [];
      acc[group].push(ing);
      return acc;
    },
    {} as Record<string, Ingredient[]>
  );
}
