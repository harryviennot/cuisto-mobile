import React, { memo } from "react";
import { Ingredient } from "@/types/recipe";
import { View, Text } from "react-native";
import { groupIngredients } from "@/utils/groupIngredients";

interface RecipeIngredientsProps {
  ingredients: Ingredient[];
  recipeServings: number;
  selectedServings: number;
}

export const RecipeIngredients = memo(function RecipeIngredients({
  ingredients,
  recipeServings,
  selectedServings,
}: RecipeIngredientsProps) {
  // Helper to scale ingredient amounts (quantity is now a number)
  const getScaledAmount = (
    ingredient: Ingredient,
    baseServings: number,
    currentServings: number
  ): string => {
    if (ingredient.quantity == null) {
      return "";
    }

    if (baseServings === currentServings) {
      return formatQuantity(ingredient.quantity);
    }

    const ratio = currentServings / baseServings;
    const scaled = ingredient.quantity * ratio;
    return formatQuantity(scaled);
  };

  // Format quantity to a clean string (remove trailing .0)
  const formatQuantity = (value: number): string => {
    return Number.isInteger(value)
      ? value.toString()
      : value.toFixed(1).replace(/\.0$/, "");
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
                  <Text className="flex-1 leading-snug">
                    {ing.quantity && (
                      <Text className="font-bold text-foreground-heading">
                        {getScaledAmount(ing, recipeServings || 4, selectedServings) + " "}
                      </Text>
                    )}

                    <Text className="text-foreground-heading">
                      {ing.unit && `${ing.unit} `}
                      {ing.quantity
                        ? ing.name
                        : ing.name.charAt(0).toUpperCase() + ing.name.slice(1)}
                      {ing.notes ? ", " : ""}
                    </Text>
                    {ing.notes && (
                      <Text className="text-sm text-foreground-muted">{ing.notes}</Text>
                    )}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </View>
      ))}
    </View>
  );
});
