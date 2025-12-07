/**
 * HomeEmptyState
 *
 * Displayed when there are no public recipes to show on the home page.
 * Encourages users to extract their first recipe.
 */
import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { ChefHat } from "phosphor-react-native";

export interface HomeEmptyStateProps {
  /** Optional custom className for the container */
  className?: string;
}

export function HomeEmptyState({ className }: HomeEmptyStateProps) {
  const router = useRouter();

  const handleExtractRecipe = () => {
    router.push("/(tabs)/new-recipe");
  };

  return (
    <View className={`flex-1 items-center justify-center px-8 ${className || ""}`}>
      <View className="w-24 h-24 rounded-full bg-primary/10 items-center justify-center mb-6">
        <ChefHat size={48} weight="duotone" color="#334d43" />
      </View>

      <Text className="text-foreground-heading font-display text-2xl text-center mb-2">
        You're one of the first here!
      </Text>

      <Text className="text-foreground-secondary text-base text-center mb-8 leading-6">
        Be a pioneer and extract your first recipe.{"\n"}
        Your discoveries will inspire others.
      </Text>

      <TouchableOpacity
        onPress={handleExtractRecipe}
        className="bg-primary px-8 py-4 rounded-full"
        activeOpacity={0.8}
      >
        <Text className="text-white font-bold text-base">
          Extract a Recipe
        </Text>
      </TouchableOpacity>
    </View>
  );
}
