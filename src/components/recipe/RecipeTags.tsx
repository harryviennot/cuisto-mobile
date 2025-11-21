import { View, Text } from "react-native";

interface RecipeTagsProps {
  categories: string[] | undefined;
  tags: string[] | undefined;
}

export function RecipeTags({ tags, categories }: RecipeTagsProps) {
  if (!categories && !tags) return null;

  return (
    <View className="flex-row flex-wrap gap-2">
      {categories?.map((tag, idx) => (
        <View key={`cat-${idx}`} className="rounded-full bg-surface-texture-light/50 px-4 py-1.5">
          <Text className="text-xs font-medium text-foreground">{tag}</Text>
        </View>
      ))}
      {tags?.map((tag, idx) => (
        <View key={`tag-${idx}`} className="rounded-full bg-surface-texture-light/50 px-4 py-1.5">
          <Text className="text-xs font-medium text-foreground">{tag}</Text>
        </View>
      ))}
    </View>
  );
}
