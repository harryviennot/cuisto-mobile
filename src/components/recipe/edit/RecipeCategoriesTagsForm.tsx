import React, { useState } from "react";
import { View, Text, Pressable } from "react-native";
import { Control, useController } from "react-hook-form";
import { useTranslation } from "react-i18next";

import { ShadowItem } from "@/components/ShadowedSection";
import { RecipeCategory } from "@/types/recipe";
import type { RecipeEditFormData } from "@/schemas/recipe.schema";
import { FormGroupInput } from "@/components/forms/FormGroupInput";

interface RecipeCategoriesTagsFormProps {
  control: Control<RecipeEditFormData, any>;
}

export function RecipeCategoriesTagsForm({ control }: RecipeCategoriesTagsFormProps) {
  const { t } = useTranslation();

  const categoryOptions = [
    { label: t("recipe.category.breakfast"), value: RecipeCategory.BREAKFAST },
    { label: t("recipe.category.lunch"), value: RecipeCategory.LUNCH },
    { label: t("recipe.category.dinner"), value: RecipeCategory.DINNER },
    { label: t("recipe.category.dessert"), value: RecipeCategory.DESSERT },
    { label: t("recipe.category.snack"), value: RecipeCategory.SNACK },
    { label: t("recipe.category.appetizer"), value: RecipeCategory.APPETIZER },
    { label: t("recipe.category.beverage"), value: RecipeCategory.BEVERAGE },
    { label: t("recipe.category.other"), value: RecipeCategory.OTHER },
  ];
  const {
    field: { value: categories, onChange: onCategoriesChange },
    fieldState: { error: categoriesError },
  } = useController({ control, name: "categories" });

  const {
    field: { value: tags, onChange: onTagsChange },
    fieldState: { error: tagsError },
  } = useController({ control, name: "tags" });

  const [newTag, setNewTag] = useState("");

  const toggleCategory = (category: string) => {
    const newCategories = categories.includes(category)
      ? categories.filter((c) => c !== category)
      : [...categories, category];

    onCategoriesChange(newCategories);
  };

  const addTag = () => {
    const trimmedTag = newTag.trim().toLowerCase();
    if (trimmedTag && !tags.includes(trimmedTag) && tags.length < 10) {
      onTagsChange([...tags, trimmedTag]);
      setNewTag("");
    }
  };

  const removeTag = (tagToRemove: string) => {
    onTagsChange(tags.filter((t) => t !== tagToRemove));
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

      {/* Categories Selection */}
      <View className="mb-6">
        <Text className="font-bold shrink-0 text-sm uppercase tracking-widest text-foreground-tertiary mb-2">
          {t("recipe.edit.categories")}
        </Text>
        <View className="flex-row flex-wrap gap-2">
          {categoryOptions.map((option) => {
            const isSelected = categories.includes(option.value);
            return (
              <Pressable key={option.value} onPress={() => toggleCategory(option.value)}>
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
                    {option.label}
                  </Text>
                </ShadowItem>
              </Pressable>
            );
          })}
        </View>
        {categoriesError && (
          <Text className="mt-1.5 text-sm text-red-600">{categoriesError.message}</Text>
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
