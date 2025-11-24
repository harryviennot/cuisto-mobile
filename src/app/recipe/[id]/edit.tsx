/**
 * Recipe detail screen for viewing saved recipes
 * Supports dynamic recipe ID parameter
 */
import React from "react";
import { View, ActivityIndicator, Text, TouchableOpacity } from "react-native";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { recipeService } from "@/api/services";
import { RecipeEdit, RecipeEditRef } from "@/components/recipe/edit/RecipeEdit";

export default function RecipeDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const {
    data: recipe,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["recipe", id],
    queryFn: () => recipeService.getRecipe(id!),
    enabled: !!id,
  });

  const recipeEditRef = React.useRef<RecipeEditRef>(null);

  if (!id) {
    return (
      <View className="flex-1 items-center justify-center bg-surface">
        <Text className="text-foreground-secondary">Invalid recipe ID</Text>
      </View>
    );
  }

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-surface">
        <ActivityIndicator size="large" color="#2D5A4A" />
      </View>
    );
  }

  if (error || !recipe) {
    return (
      <View className="flex-1 items-center justify-center bg-surface px-6">
        <Text className="text-center text-foreground-secondary">
          Failed to load recipe. Please try again.
        </Text>
      </View>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: false,
        }}
      />
      <View className="flex-1 bg-surface">
        <View className="flex-row items-center justify-between border-b border-border-light bg-surface-elevated px-4 pb-4 pt-4 shadow-sm">
          <TouchableOpacity
            onPress={() => recipeEditRef.current?.discard()}
            className="p-2"
          >
            <Text className="text-xl text-foreground-secondary">Cancel</Text>
          </TouchableOpacity>

          <Text className="text-xl text-foreground-heading">Edit Recipe</Text>

          <TouchableOpacity
            onPress={() => recipeEditRef.current?.save()}
            className="p-2"
          >
            <Text className="text-xl text-primary">Save</Text>
          </TouchableOpacity>
        </View>
        <RecipeEdit
          ref={recipeEditRef}
          recipe={recipe}
          onSave={() => router.back()}
          onDiscard={() => router.back()}
        />
      </View>
    </>
  );
}
