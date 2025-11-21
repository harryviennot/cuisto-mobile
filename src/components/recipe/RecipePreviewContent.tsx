/**
 * Shared recipe preview content component with animations
 * Displays recipe details with smooth entrance animations
 */
import { View, Text, ScrollView } from "react-native";
import Animated, { FadeInDown, FadeIn } from "react-native-reanimated";
import { useTranslation } from "react-i18next";
import type { Recipe } from "@/types/recipe";

interface RecipePreviewContentProps {
  recipe: Recipe;
  showScrollView?: boolean;
}

// Helper to group items by their group field
function groupByField<T extends { group?: string }>(items: T[]): Map<string, T[]> {
  const grouped = new Map<string, T[]>();

  items.forEach((item) => {
    const key = item.group || "ungrouped";
    if (!grouped.has(key)) {
      grouped.set(key, []);
    }
    grouped.get(key)!.push(item);
  });

  return grouped;
}

export function RecipePreviewContent({
  recipe,
  showScrollView = false,
}: RecipePreviewContentProps) {
  const { t } = useTranslation();

  const content = (
    <Animated.View entering={FadeIn.duration(400)} className="px-6 py-6">
      {/* Title */}
      <Animated.View entering={FadeInDown.delay(100).duration(400)}>
        <Text className="mb-4 text-3xl font-bold text-foreground-heading">{recipe.title}</Text>
      </Animated.View>

      {/* Description */}
      {recipe.description && (
        <Animated.View entering={FadeInDown.delay(150).duration(400)}>
          <Text className="mb-6 text-base leading-relaxed text-foreground">
            {recipe.description}
          </Text>
        </Animated.View>
      )}

      {/* Meta info */}
      <Animated.View
        entering={FadeInDown.delay(200).duration(400)}
        className="mb-6 flex-row flex-wrap gap-3"
      >
        {recipe.timings?.prep_time_minutes && (
          <View className="rounded-full bg-primary/10 px-4 py-2">
            <Text className="text-sm font-medium text-primary">
              {t("recipe.prep")}: {recipe.timings.prep_time_minutes} {t("recipe.minutes")}
            </Text>
          </View>
        )}
        {recipe.timings?.cook_time_minutes && (
          <View className="rounded-full bg-primary/10 px-4 py-2">
            <Text className="text-sm font-medium text-primary">
              {t("recipe.cook")}: {recipe.timings.cook_time_minutes} {t("recipe.minutes")}
            </Text>
          </View>
        )}
        {recipe.servings && (
          <View className="rounded-full bg-primary/10 px-4 py-2">
            <Text className="text-sm font-medium text-primary">
              {t("recipe.servings")}: {recipe.servings}
            </Text>
          </View>
        )}
      </Animated.View>

      {/* Ingredients */}
      {recipe.ingredients && recipe.ingredients.length > 0 && (
        <Animated.View entering={FadeInDown.delay(250).duration(400)} className="mb-8">
          <Text className="mb-4 text-2xl font-bold text-foreground-heading">
            {t("recipe.ingredients")}
          </Text>
          <View className="gap-6">
            {(() => {
              const grouped = groupByField(recipe.ingredients);
              let itemIndex = 0;

              return Array.from(grouped.entries()).map(([groupName, ingredients], groupIndex) => (
                <View key={groupIndex} className="gap-3">
                  {/* Group title (if not ungrouped) */}
                  {groupName !== "ungrouped" && (
                    <Text className="text-lg font-semibold text-foreground-heading">
                      {groupName}
                    </Text>
                  )}

                  {/* Ingredients in this group */}
                  {ingredients.map((ingredient, index) => {
                    const currentIndex = itemIndex++;
                    return (
                      <Animated.View
                        key={currentIndex}
                        entering={FadeInDown.delay(300 + currentIndex * 50).duration(300)}
                        className="flex-row items-start gap-3 rounded-xl bg-surface-elevated p-4"
                      >
                        <View className="mt-1 h-2 w-2 rounded-full bg-primary" />
                        <View className="flex-1">
                          <Text className="text-base text-foreground-heading">
                            {ingredient.quantity && ingredient.unit
                              ? `${ingredient.quantity} ${ingredient.unit} `
                              : ingredient.quantity
                                ? `${ingredient.quantity} `
                                : ""}
                            {ingredient.name}
                          </Text>
                          {ingredient.notes && (
                            <Text className="mt-1 text-sm italic text-foreground-secondary">
                              {ingredient.notes}
                            </Text>
                          )}
                        </View>
                      </Animated.View>
                    );
                  })}
                </View>
              ));
            })()}
          </View>
        </Animated.View>
      )}

      {/* Instructions */}
      {recipe.instructions && recipe.instructions.length > 0 && (
        <Animated.View entering={FadeInDown.delay(350).duration(400)} className="mb-8">
          <Text className="mb-4 text-2xl font-bold text-foreground-heading">
            {t("recipe.instructions")}
          </Text>
          <View className="gap-6">
            {(() => {
              const grouped = groupByField(recipe.instructions);
              let itemIndex = 0;

              return Array.from(grouped.entries()).map(([groupName, instructions], groupIndex) => (
                <View key={groupIndex} className="gap-4">
                  {/* Group title (if not ungrouped) */}
                  {groupName !== "ungrouped" && (
                    <Text className="text-lg font-semibold text-foreground-heading">
                      {groupName}
                    </Text>
                  )}

                  {/* Instructions in this group */}
                  {instructions.map((instruction, index) => {
                    const currentIndex = itemIndex++;
                    return (
                      <Animated.View
                        key={currentIndex}
                        entering={FadeInDown.delay(400 + currentIndex * 50).duration(300)}
                        className="flex-row gap-4"
                      >
                        <View className="h-8 w-8 items-center justify-center rounded-full bg-primary">
                          <Text className="font-bold text-white">
                            {instruction.step_number || currentIndex + 1}
                          </Text>
                        </View>
                        <View className="flex-1">
                          <Text className="text-base leading-relaxed text-foreground-heading">
                            {instruction.description}
                          </Text>
                          {instruction.timer_minutes && (
                            <Text className="mt-1 text-sm text-foreground-secondary">
                              ⏱️ {instruction.timer_minutes} minutes
                            </Text>
                          )}
                        </View>
                      </Animated.View>
                    );
                  })}
                </View>
              ));
            })()}
          </View>
        </Animated.View>
      )}
    </Animated.View>
  );

  if (showScrollView) {
    return (
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {content}
      </ScrollView>
    );
  }

  return content;
}
