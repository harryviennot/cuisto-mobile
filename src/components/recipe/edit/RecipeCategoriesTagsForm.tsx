import React, { useState } from "react";
import { View, Text, Pressable, TextInput as RNTextInput } from "react-native";
import { Control, useController } from "react-hook-form";
import { XIcon, PlusIcon } from "phosphor-react-native";

import { ShadowItem } from "@/components/ShadowedSection";
import { RecipeCategory } from "@/types/recipe";
import type { RecipeEditFormData } from "@/schemas/recipe.schema";
import { useDeviceType } from "@/hooks/useDeviceType";

interface RecipeCategoriesTagsFormProps {
  control: Control<RecipeEditFormData, any>;
}

const categoryOptions = [
  { label: "Breakfast", value: RecipeCategory.BREAKFAST },
  { label: "Lunch", value: RecipeCategory.LUNCH },
  { label: "Dinner", value: RecipeCategory.DINNER },
  { label: "Dessert", value: RecipeCategory.DESSERT },
  { label: "Snack", value: RecipeCategory.SNACK },
  { label: "Appetizer", value: RecipeCategory.APPETIZER },
  { label: "Beverage", value: RecipeCategory.BEVERAGE },
  { label: "Other", value: RecipeCategory.OTHER },
];

export function RecipeCategoriesTagsForm({ control }: RecipeCategoriesTagsFormProps) {
  const {
    field: { value: categories, onChange: onCategoriesChange },
    fieldState: { error: categoriesError },
  } = useController({ control, name: "categories" });

  const { isTablet } = useDeviceType();

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
        Categories & Tags
      </Text>

      {/* Categories Selection */}
      <View className="mb-6">
        <Text className="font-bold shrink-0 text-sm uppercase tracking-widest text-foreground-tertiary mb-2">
          Categories
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
      <View className="mb-4">
        <Text className="font-bold shrink-0 text-sm uppercase tracking-widest text-foreground-tertiary mb-2">
          Tags
        </Text>

        {/* Add Tag Input */}
        <View className={`mb-3 flex-row ${isTablet ? "gap-4" : "gap-2"}`}>
          <View className="flex-1">
            <RNTextInput
              value={newTag}
              onChangeText={setNewTag}
              onSubmitEditing={addTag}
              placeholder="e.g., vegan, gluten-free, quick..."
              placeholderTextColor="#a89f8d"
              className="rounded-xl border border-border-button bg-white px-4 py-3.5 text-base text-foreground"
              returnKeyType="done"
              autoCapitalize="none"
            />
          </View>

          <ShadowItem
            variant="primary"
            className={`items-center justify-center rounded-xl px-4 ${
              !newTag.trim() || tags.length >= 10 ? "opacity-50" : ""
            }`}
            onPress={addTag}
            disabled={!newTag.trim() || tags.length >= 10}
          >
            <PlusIcon size={20} color="#FFFFFF" weight="bold" />
          </ShadowItem>
        </View>

        {/* Current Tags */}
        {tags.length > 0 && (
          <View className="flex-row flex-wrap gap-2">
            {tags.map((tag) => (
              <ShadowItem
                key={tag}
                className="flex-row items-center gap-2 rounded-full bg-surface-elevated px-3 py-2"
              >
                <Text className="text-sm text-foreground">#{tag}</Text>
                <Pressable onPress={() => removeTag(tag)}>
                  <XIcon size={16} color="#3a3226" weight="bold" />
                </Pressable>
              </ShadowItem>
            ))}
          </View>
        )}

        {tagsError && <Text className="mt-1.5 text-sm text-red-600">{tagsError.message}</Text>}
      </View>
    </View>
  );
}
