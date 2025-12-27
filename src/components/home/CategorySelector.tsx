/**
 * CategorySelector - Horizontal scrolling category filter
 *
 * Displays all categories in a horizontal scroll view.
 * Includes an "All" option at the beginning (default selected).
 */
import React, { useMemo } from "react";
import { View, ActivityIndicator } from "react-native";
import { useTranslation } from "react-i18next";
import { CategoryTabChip } from "./CategoryChip";
import HorizontalTabBar, { type TabItem } from "../ui/HorizontalTabBar";
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

  // Sort categories by display_order and convert to TabItem format
  const tabs: TabItem[] = useMemo(() => {
    const sortedCategories = [...categories].sort(
      (a, b) => (a.display_order ?? 0) - (b.display_order ?? 0)
    );

    const allTab: TabItem = {
      id: "all",
      label: t("discovery.categories.all", { defaultValue: "All" }),
      value: { slug: "all", categoryId: null },
    };

    const categoryTabs: TabItem[] = sortedCategories.map((cat) => ({
      id: cat.id,
      label: t(`categories.${cat.slug}`, { defaultValue: cat.slug }),
      value: { slug: cat.slug, categoryId: cat.id },
    }));

    return [allTab, ...categoryTabs];
  }, [categories, t]);

  const activeTabId = selectedCategoryId ?? "all";

  const handleTabChange = (tab: TabItem) => {
    onSelectCategory(tab.value?.categoryId ?? null);
  };

  return (
    <HorizontalTabBar
      tabs={tabs}
      activeTabId={activeTabId}
      onTabChange={handleTabChange}
      TabComponent={CategoryTabChip}
      showIndicator={false}
    />
  );
}
