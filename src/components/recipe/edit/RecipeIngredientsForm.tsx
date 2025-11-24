import React, { useState, useEffect, useMemo } from "react";
import {
  View,
  Text,
  LayoutAnimation,
  Platform,
  UIManager,
} from "react-native";
import { Control, useController } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { DraggableList } from "../../DragAndDrop/DraggableList";
import { RenderItemParams } from "../../DragAndDrop/types";
import * as Haptics from "expo-haptics";
import type { RecipeEditFormData } from "@/schemas/recipe.schema";
import type { Ingredient } from "@/types/recipe";

import { ExpandableIngredientForm } from "./ExpandableIngredientForm";
import { IngredientItem } from "./IngredientItem";
import { GroupHeader } from "./GroupHeader";
import { FormGroupInput } from "@/components/forms/FormGroupInput";

// Enable LayoutAnimation on Android
if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface RecipeIngredientsFormProps {
  control: Control<RecipeEditFormData, any>;
}

// Type for flat list items (either group header or ingredient)
type FlatListItem =
  | { type: "header"; groupName: string; id: string }
  | { type: "ingredient"; ingredient: Ingredient; ingredientId: string; id: string };

export function RecipeIngredientsForm({ control }: RecipeIngredientsFormProps) {
  const { t } = useTranslation();

  const {
    field: { value: ingredients, onChange: onIngredientsChange },
    fieldState: { error: ingredientsError },
  } = useController({ control, name: "ingredients" });

  const [newGroupName, setNewGroupName] = useState("");
  const [groupNames, setGroupNames] = useState<string[]>([]);
  const [addingToGroup, setAddingToGroup] = useState<string | null>(null);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  // Transform ingredients into flat list structure with headers
  const flatData = useMemo(() => {
    const allGroups = ["Main", ...groupNames];
    const items: FlatListItem[] = [];

    allGroups.forEach((groupName) => {
      const groupIngredients = ingredients.filter(
        (ing: Ingredient) => (ing.group || "Main") === groupName
      );

      // Add header for all non-Main groups (even if empty)
      if (groupName !== "Main") {
        items.push({
          type: "header",
          groupName,
          id: `header-${groupName}`,
        });
      }

      // Add ingredients for this group
      groupIngredients.forEach((ingredient: Ingredient) => {
        // Create unique stable ID using global index to prevent duplicates
        const globalIndex = ingredients.indexOf(ingredient);
        const ingredientId = `ingredient-${globalIndex}-${ingredient.name}-${ingredient.quantity || "none"}-${ingredient.unit || "none"}`;
        items.push({
          type: "ingredient",
          ingredient,
          ingredientId,
          id: ingredientId,
        });
      });
    });

    return items;
  }, [ingredients, groupNames]);

  // Helper to set addingToGroup with animation
  const setAddingToGroupAnimated = (groupName: string | null) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setAddingToGroup(groupName);
  };

  // Helper to set editingIndex with animation
  const setEditingIndexAnimated = (index: number | null) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setEditingIndex(index);
  };

  // Initialize group names from ingredients on mount
  useEffect(() => {
    const seen = new Set<string>();
    const groups: string[] = [];

    ingredients.forEach((ing: Ingredient) => {
      const group = ing.group || "Main";
      if (group !== "Main" && !seen.has(group)) {
        seen.add(group);
        groups.push(group);
      }
    });

    setGroupNames(groups);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Handle drag end - reconstruct ingredients array from flat list
  const handleDragEnd = ({ data }: { data: FlatListItem[] }) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    // Extract only ingredient items and reconstruct array
    const newIngredients: Ingredient[] = [];
    let currentGroup: string | undefined = undefined;

    data.forEach((item) => {
      if (item.type === "header") {
        currentGroup = item.groupName;
      } else if (item.type === "ingredient") {
        // Update ingredient's group based on which header it's under
        newIngredients.push({
          ...item.ingredient,
          group: currentGroup === "Main" ? undefined : currentGroup,
        });
      }
    });

    onIngredientsChange(newIngredients);
  };

  // Add a new group
  const addGroup = () => {
    const trimmedGroupName = newGroupName.trim();
    if (trimmedGroupName && !groupNames.includes(trimmedGroupName) && trimmedGroupName !== "Main") {
      setGroupNames([...groupNames, trimmedGroupName]);
      setNewGroupName("");
    }
  };

  // Delete a group and move its ingredients to the previous group
  const deleteGroup = (groupToDelete: string) => {
    if (groupToDelete === "Main") return;

    const allGroups = ["Main", ...groupNames];
    const groupIndex = allGroups.indexOf(groupToDelete);
    const previousGroup = groupIndex > 0 ? allGroups[groupIndex - 1] : "Main";

    const updatedIngredients = ingredients.map((ing: Ingredient) => {
      if (ing.group === groupToDelete) {
        return { ...ing, group: previousGroup === "Main" ? undefined : previousGroup };
      }
      return ing;
    });

    setGroupNames(groupNames.filter((g) => g !== groupToDelete));
    onIngredientsChange(updatedIngredients);
  };

  // Move a group up in the order
  const moveGroupUp = (groupName: string) => {
    const groupIndex = groupNames.indexOf(groupName);
    if (groupIndex <= 0) return;

    const newGroupNames = [...groupNames];
    [newGroupNames[groupIndex - 1], newGroupNames[groupIndex]] = [
      newGroupNames[groupIndex],
      newGroupNames[groupIndex - 1],
    ];
    setGroupNames(newGroupNames);

    // Reorder ingredients array to match new group order
    const allGroups = ["Main", ...newGroupNames];
    const reorderedIngredients: Ingredient[] = [];

    allGroups.forEach((group) => {
      const groupIngredients = ingredients.filter(
        (ing: Ingredient) => (ing.group || "Main") === group
      );
      reorderedIngredients.push(...groupIngredients);
    });

    onIngredientsChange(reorderedIngredients);
  };

  // Move a group down in the order
  const moveGroupDown = (groupName: string) => {
    const groupIndex = groupNames.indexOf(groupName);
    if (groupIndex < 0 || groupIndex >= groupNames.length - 1) return;

    const newGroupNames = [...groupNames];
    [newGroupNames[groupIndex], newGroupNames[groupIndex + 1]] = [
      newGroupNames[groupIndex + 1],
      newGroupNames[groupIndex],
    ];
    setGroupNames(newGroupNames);

    // Reorder ingredients array to match new group order
    const allGroups = ["Main", ...newGroupNames];
    const reorderedIngredients: Ingredient[] = [];

    allGroups.forEach((group) => {
      const groupIngredients = ingredients.filter(
        (ing: Ingredient) => (ing.group || "Main") === group
      );
      reorderedIngredients.push(...groupIngredients);
    });

    onIngredientsChange(reorderedIngredients);
  };

  // Remove an ingredient
  const removeIngredient = (index: number) => {
    const updatedIngredients = ingredients.filter((_: any, i: number) => i !== index);
    onIngredientsChange(updatedIngredients);
  };

  // Add a new ingredient to a specific group
  const addIngredient = (ingredient: Ingredient, groupName: string) => {
    // Find the last ingredient in this group to insert after it
    const groupIngredients = ingredients.filter(
      (ing: Ingredient) => (ing.group || "Main") === groupName
    );

    if (groupIngredients.length === 0) {
      // No ingredients in this group yet - add at the appropriate position
      const allGroups = ["Main", ...groupNames];
      const groupIndex = allGroups.indexOf(groupName);

      // Find the index to insert at (after the last ingredient of the previous group)
      let insertIndex = 0;
      for (let i = 0; i < groupIndex; i++) {
        const prevGroupName = allGroups[i];
        const prevGroupIngredients = ingredients.filter(
          (ing: Ingredient) => (ing.group || "Main") === prevGroupName
        );
        insertIndex += prevGroupIngredients.length;
      }

      const updatedIngredients = [...ingredients];
      updatedIngredients.splice(insertIndex, 0, ingredient);
      onIngredientsChange(updatedIngredients);
    } else {
      // Add after the last ingredient in this group
      const lastIngredient = groupIngredients[groupIngredients.length - 1];
      const lastIndex = ingredients.indexOf(lastIngredient);

      const updatedIngredients = [...ingredients];
      updatedIngredients.splice(lastIndex + 1, 0, ingredient);
      onIngredientsChange(updatedIngredients);
    }

    setAddingToGroupAnimated(null);
  };

  // Edit an existing ingredient
  const editIngredient = (index: number, updatedIngredient: Ingredient) => {
    const updatedIngredients = [...ingredients];
    updatedIngredients[index] = updatedIngredient;
    onIngredientsChange(updatedIngredients);
    setEditingIndexAnimated(null);
  };

  // Render individual item in the draggable list
  const renderDraggableItem = ({ item, drag, isActive, ...rest }: RenderItemParams<FlatListItem>) => {
    // @ts-ignore - Extract internal props passed from DraggableList
    const { internalProps } = rest;

    // Render group header (non-draggable but shifts)
    if (item.type === "header") {
      const groupIndex = groupNames.indexOf(item.groupName);
      return (
        <GroupHeader
          groupName={item.groupName}
          groupIndex={groupIndex}
          totalGroups={groupNames.length}
          onMoveUp={() => moveGroupUp(item.groupName)}
          onMoveDown={() => moveGroupDown(item.groupName)}
          internalProps={internalProps}
        />
      );
    }

    // Render ingredient item (draggable)
    const { ingredient } = item;

    // Find the current index in the ingredients array
    const currentIndex = ingredients.findIndex(
      (ing: Ingredient) =>
        ing.name === ingredient.name &&
        ing.quantity === ingredient.quantity &&
        ing.unit === ingredient.unit &&
        ing.group === ingredient.group
    );

    const isEditing = editingIndex === currentIndex && currentIndex !== -1;

    if (isEditing) {
      return (
        <View className="mb-2">
          <ExpandableIngredientForm
            mode="edit"
            groupName={ingredient.group || "Main"}
            ingredient={ingredient}
            isExpanded={isEditing}
            onToggle={() => setEditingIndexAnimated(null)}
            onSave={(updated: Ingredient) => editIngredient(currentIndex, updated)}
          />
        </View>
      );
    }

    return (
      <IngredientItem
        ingredient={ingredient}
        isActive={isActive}
        drag={drag}
        onEdit={() => currentIndex !== -1 && setEditingIndexAnimated(currentIndex)}
        onDelete={() => currentIndex !== -1 && removeIngredient(currentIndex)}
        internalProps={internalProps}
      />
    );
  };

  return (
    <View className="">
      {/* Section Header */}
      <Text
        className="font-playfair-bold mb-4 text-2xl uppercase tracking-wide text-foreground-heading"
        style={{ fontFamily: "PlayfairDisplay_700Bold" }}
      >
        {t("recipe.edit.ingredients")}
      </Text>

      {/* Group Management */}
      <FormGroupInput
        label={t("recipe.edit.ingredientGroups")}
        placeholder={t("recipe.edit.ingredientGroupsPlaceholder")}
        items={groupNames}
        newItemValue={newGroupName}
        onNewItemChange={setNewGroupName}
        onAddItem={addGroup}
        onRemoveItem={deleteGroup}
        autoCapitalize="words"
        className="mb-6"
      />

      {/* Ingredients by Group - Drag and Drop List */}
      <View>
        {flatData.length > 0 ? (
          <DraggableList
            data={flatData}
            onDragEnd={handleDragEnd}
            keyExtractor={(item: FlatListItem) => item.id}
            renderItem={renderDraggableItem}
            activationDelay={500}
            autoscrollThreshold={50}
            autoscrollSpeed={10}

          />
        ) : (
          <View className="rounded-xl border border-dashed border-border-light bg-surface-elevated p-4">
            <Text className="text-center text-sm text-foreground-muted italic">
              {t("recipe.edit.noIngredientsYet")}
            </Text>
          </View>
        )}

        {/* Single Add Ingredient Form at the end */}
        <View className="mt-4">
          <ExpandableIngredientForm
            mode="add"
            groupName={groupNames.length > 0 ? groupNames[groupNames.length - 1] : "Main"}
            isExpanded={addingToGroup !== null}
            onToggle={() =>
              setAddingToGroupAnimated(
                addingToGroup !== null
                  ? null
                  : groupNames.length > 0
                    ? groupNames[groupNames.length - 1]
                    : "Main"
              )
            }
            onSave={(ingredient: Ingredient) =>
              addIngredient(
                ingredient,
                groupNames.length > 0 ? groupNames[groupNames.length - 1] : "Main"
              )
            }
          />
        </View>
      </View >

      {ingredientsError && (
        <Text className="mt-1.5 text-sm text-red-600">{ingredientsError.message}</Text>
      )}
    </View >
  );
}
