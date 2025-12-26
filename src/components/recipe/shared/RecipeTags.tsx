import { View, Text } from "react-native";
import { useTranslation } from "react-i18next";
import { Skeleton } from "@/components/ui/Skeleton";
import type { Category } from "@/types/recipe";

interface RecipeTagsProps {
  category?: Category | null;
  tags: string[] | undefined;
  isLoading?: boolean;
}

export function RecipeTags({ tags, category, isLoading = false }: RecipeTagsProps) {
  const { t } = useTranslation();

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

  if (!category && !tags) return null;

  // Get translated category label
  const categoryLabel = category?.slug
    ? t("categories." + category.slug, { defaultValue: category.slug })
    : null;

  return (
    <View className="flex-row flex-wrap gap-2">
      {categoryLabel && (
        <View
          className="rounded-full px-4 py-1.5"
          style={{
            backgroundColor: "rgba(51, 77, 67, 0.08)",
          }}
        >
          <Text className="text-xs font-medium text-[#334d43]">{categoryLabel}</Text>
        </View>
      )}
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
