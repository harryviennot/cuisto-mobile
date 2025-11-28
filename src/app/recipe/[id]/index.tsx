/**
 * Recipe detail screen for viewing saved recipes
 * Supports dynamic recipe ID parameter
 */
import { View, Text } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { recipeService } from "@/api/services";
import { RecipeDetail } from "@/components/recipe/RecipeDetail";
import { useDeviceType } from "@/hooks/useDeviceType";

export default function RecipeDetailScreen() {
  const { id, title, imageUrl } = useLocalSearchParams<{
    id: string;
    title?: string;
    imageUrl?: string;
  }>();
  const router = useRouter();
  const { isTablet } = useDeviceType();

  const {
    data: recipe,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["recipe", id],
    queryFn: () => recipeService.getRecipe(id!),
    enabled: !!id,
  });

  if (!id) {
    return (
      <View className="flex-1 items-center justify-center bg-surface">
        <Text className="text-foreground-secondary">Invalid recipe ID</Text>
      </View>
    );
  }

  console.log(recipe?.source_type, recipe?.source_url);

  return (
    <RecipeDetail
      recipe={isTablet ? recipe : recipe}
      isLoading={isTablet ? isLoading : isLoading}
      error={error as Error | null}
      onBack={() => router.back()}
      onRetry={() => refetch()}
      optimisticTitle={title}
      optimisticImageUrl={imageUrl}
    />
  );
}
