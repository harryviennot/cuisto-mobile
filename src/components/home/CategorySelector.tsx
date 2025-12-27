/**
 * CategorySelector - Horizontal scrolling category filter
 *
 * Displays all categories in a horizontal scroll view.
 * Includes an "All" option at the beginning (default selected).
 */
import React, { useCallback } from "react";
import { View, FlatList, ActivityIndicator } from "react-native";
import { useTranslation } from "react-i18next";
import { CategoryChip } from "./CategoryChip";
import type { Category } from "@/types/recipe";

interface CategorySelectorProps {
  /** List of categories to display */
  categories: Category[];
  /** Currently selected category ID (null = "All") */
  selectedCategoryId: string | null;
  /** Callback when a category is selected */
  onSelectCategory: (categoryId: string | null) => void;
  /** Whether categories are still loading */
  isLoading?: boolean;
}

export function CategorySelector({
  categories,
  selectedCategoryId,
  onSelectCategory,
  isLoading = false,
}: CategorySelectorProps) {
  const { t } = useTranslation();

  // Render loading state
  if (isLoading) {
    return (
      <View className="h-12 justify-center px-6">
        <ActivityIndicator size="small" color="#334d43" />
      </View>
    );
  }

  // Sort categories by display_order
  const sortedCategories = [...categories].sort(
    (a, b) => (a.display_order ?? 0) - (b.display_order ?? 0)
  );

  // Render individual category chip
  const renderItem = useCallback(
    ({ item }: { item: { slug: string; id: string | null } }) => {
      const isAll = item.slug === "all";
      const isSelected = isAll
        ? selectedCategoryId === null
        : selectedCategoryId === item.id;

      const label = isAll
        ? t("discovery.categories.all", { defaultValue: "All" })
        : t(`categories.${item.slug}`, { defaultValue: item.slug });

      return (
        <CategoryChip
          slug={item.slug}
          label={label}
          isSelected={isSelected}
          onPress={() => onSelectCategory(isAll ? null : item.id)}
        />
      );
    },
    [selectedCategoryId, onSelectCategory, t]
  );

  // Prepend "All" option to the categories list
  const dataWithAll = [
    { slug: "all", id: null, display_order: -1 },
    ...sortedCategories,
  ];

  return (
    <FlatList
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ paddingHorizontal: 20, gap: 8 }}
      data={dataWithAll}
      keyExtractor={(item) => item.slug}
      renderItem={renderItem}
    />
  );
}
