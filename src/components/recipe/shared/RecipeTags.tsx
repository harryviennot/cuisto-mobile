import { View, Text } from "react-native";
import { Skeleton } from "@/components/ui/Skeleton";

interface RecipeTagsProps {
  categories: string[] | undefined;
  tags: string[] | undefined;
  isLoading?: boolean;
}

export function RecipeTags({ tags, categories, isLoading = false }: RecipeTagsProps) {
  if (isLoading) {
    return (
      <View className="flex-row flex-wrap gap-2">
        <Skeleton width={80} height={28} borderRadius={14} />
        <Skeleton width={100} height={28} borderRadius={14} />
        <Skeleton width={70} height={28} borderRadius={14} />
        <Skeleton width={90} height={28} borderRadius={14} />
      </View>
    );
  }

  if (!categories && !tags) return null;

  return (
    <View className="flex-row flex-wrap gap-2">
      {categories?.map((tag, idx) => (
        <View
          key={`cat-${idx}`}
          className="rounded-full px-4 py-1.5"
          style={{
            backgroundColor: "rgba(51, 77, 67, 0.08)",
          }}
        >
          <Text className="text-xs font-medium text-[#334d43]">{tag}</Text>
        </View>
      ))}
      {tags?.map((tag, idx) => (
        <View
          key={`tag-${idx}`}
          className="rounded-full  px-4 py-1.5"
          style={{
            backgroundColor: "rgba(51, 77, 67, 0.08)",
          }}
        >
          <Text className="text-xs font-medium text-[#334d43]">{tag}</Text>
        </View>
      ))}
    </View>
  );
}
