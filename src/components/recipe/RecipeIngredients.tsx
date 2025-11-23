import { Ingredient } from "@/types/recipe";
import { View, Text } from "react-native";
import { groupIngredients } from "@/utils/groupIngredients";

interface RecipeIngredientsProps {
  ingredients: Ingredient[];
  recipeServings: number;
  selectedServings: number;
}

export function RecipeIngredients({
  ingredients,
  recipeServings,
  selectedServings,
}: RecipeIngredientsProps) {
  // Helper to scale ingredient amounts
  const getScaledAmount = (
    ingredient: Ingredient,
    baseServings: number,
    currentServings: number
  ) => {
    if (!ingredient.quantity || baseServings === currentServings) {
      return ingredient.quantity || "";
    }

    const ratio = currentServings / baseServings;
    const quantity = ingredient.quantity.toString();

    // Try to parse and scale numeric values
    const numMatch = quantity.match(/(\d+\.?\d*)/);
    if (numMatch) {
      const num = parseFloat(numMatch[1]);
      const scaled = num * ratio;
      const scaledStr = Number.isInteger(scaled)
        ? scaled.toString()
        : scaled.toFixed(1).replace(/\.0$/, "");
      return quantity.replace(numMatch[1], scaledStr);
    }

    return quantity;
  };

  // Group ingredients by group field
  const groupedIngredients = groupIngredients(ingredients);

  return (
    <View className="gap-8">
      {Object.entries(groupedIngredients).map(([groupName, ingredients]) => (
        <View key={groupName}>
          {groupName !== "Main" && (
            <View className="mb-4 mt-2 flex-row items-center gap-4">
              <Text
                className="font-bold shrink-0 text-xs uppercase tracking-widest text-foreground-tertiary"
                // style={{ fontFamily: "PlayfairDisplay_400Regular_Italic" }}
              >
                {groupName}
              </Text>
              <View className="h-px flex-1 bg-border-light" />
            </View>
          )}
          <View className="gap-5">
            {ingredients.map((ing, idx) => (
              <View key={idx} className="flex-row items-start gap-3">
                <View className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-foreground-heading" />
                <View className="w-full flex-1 flex-row flex-wrap items-baseline gap-1 border-b border-border-light pb-4">
                  {ing.quantity && (
                    <Text className="font-bold text-foreground-heading">
                      {getScaledAmount(ing, recipeServings || 4, selectedServings)}
                    </Text>
                  )}

                  <Text className="text-foreground-heading">
                    {ing.unit && ` ${ing.unit} `}
                    {ing.quantity ? ing.name : ing.name.charAt(0).toUpperCase() + ing.name.slice(1)}
                    {ing.notes ? "," : ""}
                  </Text>
                  {ing.notes && <Text className="text-sm text-foreground-muted">{ing.notes}</Text>}
                </View>
              </View>
            ))}
          </View>
        </View>
      ))}
    </View>
  );
}
