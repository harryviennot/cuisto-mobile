import React, { useState } from "react";
import { View, Text, Pressable, ActivityIndicator } from "react-native";
import { Control, useController } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";

import { ShadowItem } from "@/components/ShadowedSection";
import type { RecipeEditFormData } from "@/schemas/recipe.schema";
import { FormGroupInput } from "@/components/forms/FormGroupInput";
import { categoryService } from "@/api/services";

interface RecipeCategoriesTagsFormProps {
  control: Control<RecipeEditFormData, any>;
}

export function RecipeCategoriesTagsForm({ control }: RecipeCategoriesTagsFormProps) {
  const { t } = useTranslation();

  // Fetch categories from API
  const { data: categories = [], isLoading: categoriesLoading } = useQuery({
    queryKey: ["categories"],
    queryFn: () => categoryService.getCategories(),
    staleTime: 1000 * 60 * 60, // Cache for 1 hour
  });

  const {
    field: { value: selectedCategorySlug, onChange: onCategoryChange },
    fieldState: { error: categoryError },
  } = useController({ control, name: "category_slug" });

  const {
    field: { value: tags, onChange: onTagsChange },
    fieldState: { error: tagsError },
  } = useController({ control, name: "tags" });

  const [newTag, setNewTag] = useState("");

  const selectCategory = (slug: string) => {
    // Toggle: if already selected, deselect; otherwise select
    onCategoryChange(selectedCategorySlug === slug ? null : slug);
  };

  const addTag = () => {
    const trimmedTag = newTag.trim().toLowerCase();
    if (trimmedTag && !tags.includes(trimmedTag) && tags.length < 10) {
      onTagsChange([...tags, trimmedTag]);
      setNewTag("");
    }
  };

  const removeTag = (tagToRemove: string) => {
    onTagsChange(tags.filter((tag) => tag !== tagToRemove));
  };

  return (
    <View className="gap-2">
      {/* Section Header */}
      <Text
        className="font-playfair-bold mb-4 text-2xl uppercase tracking-wide text-foreground-heading"
        style={{ fontFamily: "PlayfairDisplay_700Bold" }}
      >
        {t("recipe.edit.categoriesAndTags")}
      </Text>

      {/* Category Selection (single select) */}
      <View className="mb-6">
        <Text className="font-bold shrink-0 text-sm uppercase tracking-widest text-foreground-tertiary mb-2">
          {t("recipe.edit.category")}
        </Text>
        {categoriesLoading ? (
          <ActivityIndicator size="small" color="#334d43" />
        ) : (
          <View className="flex-row flex-wrap gap-2">
            {categories.map((category) => {
              const isSelected = selectedCategorySlug === category.slug;
              const label = t("categories." + category.slug, { defaultValue: category.slug });
              return (
                <Pressable key={category.id} onPress={() => selectCategory(category.slug)}>
                  <ShadowItem
                    className={`rounded-full px-4 py-2.5 ${
                      isSelected
                        ? "border border-primary bg-primary/10"
                        : "border border-border-button opacity-60"
                    }`}
                  >
                    <Text
                      className={`text-sm font-semibold ${
                        isSelected ? "text-primary" : "text-foreground"
                      }`}
                    >
                      {label}
                    </Text>
                  </ShadowItem>
                </Pressable>
              );
            })}
          </View>
        )}
        {categoryError && (
          <Text className="mt-1.5 text-sm text-red-600">{categoryError.message}</Text>
        )}
      </View>

      {/* Tags Input */}
      <FormGroupInput
        label={t("recipe.edit.tags")}
        placeholder={t("recipe.edit.tagsPlaceholder")}
        items={tags}
        newItemValue={newTag}
        onNewItemChange={setNewTag}
        onAddItem={addTag}
        onRemoveItem={removeTag}
        autoCapitalize="none"
        maxItems={10}
        itemPrefix="#"
        className="mb-6"
      />

      {tagsError && <Text className="mt-1.5 text-sm text-red-600">{tagsError.message}</Text>}
    </View>
  );
}
