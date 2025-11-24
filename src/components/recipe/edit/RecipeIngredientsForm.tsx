import React, { useState, useEffect } from "react";
import { View, Text, Pressable, TextInput as RNTextInput, Animated, LayoutAnimation, Platform, UIManager } from "react-native";
import { Control, useController } from "react-hook-form";
import { XIcon, PlusIcon, CaretUpIcon, CaretDownIcon, CheckIcon } from "phosphor-react-native";

// Enable LayoutAnimation on Android
if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

import { ShadowItem } from "@/components/ShadowedSection";
import type { RecipeEditFormData } from "@/schemas/recipe.schema";
import type { Ingredient } from "@/types/recipe";
import { useDeviceType } from "@/hooks/useDeviceType";
import { groupIngredients } from "@/utils/groupIngredients";

interface RecipeIngredientsFormProps {
  control: Control<RecipeEditFormData, any>;
}

interface IngredientFormProps {
  mode: "add" | "edit";
  groupName: string;
  ingredient?: Ingredient;
  onSave: (ingredient: Ingredient) => void;
  onCancel: () => void;
}

function IngredientForm({ mode, groupName, ingredient, onSave, onCancel }: IngredientFormProps) {
  const { isTablet } = useDeviceType();
  const [name, setName] = useState(ingredient?.name || "");
  const [quantity, setQuantity] = useState(ingredient?.quantity || "");
  const [unit, setUnit] = useState(ingredient?.unit || "");
  const [notes, setNotes] = useState(ingredient?.notes || "");

  // Animation values
  const [fadeAnim] = useState(new Animated.Value(0));
  const [scaleAnim] = useState(new Animated.Value(0.95));

  // Animate in on mount
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 100,
        friction: 10,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleSave = () => {
    if (!name.trim()) return;

    const savedIngredient: Ingredient = {
      name: name.trim(),
      quantity: quantity.trim() || undefined,
      unit: unit.trim() || undefined,
      notes: notes.trim() || undefined,
      group:
        mode === "edit" && ingredient?.group
          ? ingredient.group
          : groupName === "Main"
            ? undefined
            : groupName,
    };

    onSave(savedIngredient);

    // Reset form only in add mode
    if (mode === "add") {
      setName("");
      setQuantity("");
      setUnit("");
      setNotes("");
    }
  };

  const handleCancel = () => {
    // Animate out before closing
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 0.95,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onCancel();
    });
  };

  return (
    <Animated.View
      style={{
        opacity: fadeAnim,
        transform: [{ scale: scaleAnim }],
      }}
    >
      <ShadowItem className="rounded-xl border-2 border-primary/30 bg-primary/5 p-4">
        <Text className="mb-3 text-sm font-bold uppercase tracking-widest text-primary">
          {mode === "add"
            ? `Add Ingredient${groupName !== "Main" ? ` to ${groupName}` : ""}`
            : "Edit Ingredient"}
        </Text>

        {/* Main Row: Quantity, Unit, Name - matches preview layout */}
        <View className={`mb-3 flex-row items-center ${isTablet ? "gap-2.5" : "gap-2"}`}>
          {/* Quantity */}
          <View style={{ width: isTablet ? 90 : 70 }}>
            <RNTextInput
              value={quantity}
              onChangeText={setQuantity}
              placeholder="Qty"
              placeholderTextColor="#a89f8d"
              className="rounded-lg border border-border-button bg-white px-3 py-3 text-base text-foreground"
              keyboardType="numeric"
              returnKeyType="next"
            />
          </View>

          {/* Unit */}
          <View style={{ width: isTablet ? 110 : 85 }}>
            <RNTextInput
              value={unit}
              onChangeText={setUnit}
              placeholder="Unit"
              placeholderTextColor="#a89f8d"
              className="rounded-lg border border-border-button bg-white px-3 py-3 text-base text-foreground"
              autoCapitalize="none"
              returnKeyType="next"
            />
          </View>

          {/* Ingredient Name - takes remaining space */}
          <View className="flex-1">
            <RNTextInput
              value={name}
              onChangeText={setName}
              placeholder="Ingredient name *"
              placeholderTextColor="#a89f8d"
              className="rounded-lg border border-border-button bg-white px-3 py-3 text-base text-foreground"
              autoCapitalize="words"
              returnKeyType="next"
            />
          </View>
        </View>

        {/* Notes - Full Width */}
        <View className="mb-4 w-full">
          <RNTextInput
            value={notes}
            onChangeText={setNotes}
            placeholder="Notes (e.g., chopped, optional)"
            placeholderTextColor="#a89f8d"
            className="rounded-lg border border-border-button bg-white px-3 py-3 text-base text-foreground"
            autoCapitalize="none"
            returnKeyType="done"
            onSubmitEditing={handleSave}
          />
        </View>

        {/* Action Buttons */}
        <View className={`flex-row ${isTablet ? "gap-3" : "gap-2"}`}>
          <Pressable onPress={handleCancel} className="flex-1">
            <ShadowItem className="items-center rounded-lg border border-border-button bg-white py-3">
              <Text className="text-sm font-semibold text-foreground">Cancel</Text>
            </ShadowItem>
          </Pressable>
          <Pressable onPress={handleSave} className="flex-1" disabled={!name.trim()}>
            <ShadowItem
              variant="primary"
              className={`flex-row items-center justify-center gap-1.5 rounded-lg py-3 ${
                !name.trim() ? "opacity-50" : ""
              }`}
            >
              <CheckIcon size={16} color="#FFFFFF" weight="bold" />
              <Text className="text-sm font-semibold text-white">
                {mode === "add" ? "Add" : "Save"}
              </Text>
            </ShadowItem>
          </Pressable>
        </View>
      </ShadowItem>
    </Animated.View>
  );
}

export function RecipeIngredientsForm({ control }: RecipeIngredientsFormProps) {
  const {
    field: { value: ingredients, onChange: onIngredientsChange },
    fieldState: { error: ingredientsError },
  } = useController({ control, name: "ingredients" });

  const { isTablet } = useDeviceType();
  const [newGroupName, setNewGroupName] = useState("");
  const [groupNames, setGroupNames] = useState<string[]>([]);
  const [addingToGroup, setAddingToGroup] = useState<string | null>(null);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

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

  const groupedIngredients = groupIngredients(ingredients);

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

  // Move ingredient up within its group or to previous group
  const moveIngredientUp = (ingredientIndex: number) => {
    const ingredient = ingredients[ingredientIndex];
    const group = ingredient.group || "Main";

    // Find all ingredients in the same group
    const groupIngredients = ingredients.filter(
      (ing: Ingredient) => (ing.group || "Main") === group
    );
    const indexInGroup = groupIngredients.indexOf(ingredient);

    if (indexInGroup === 0) {
      // First in group - can't move up if in "Main"
      if (group === "Main") return;

      // Move to previous group (last position)
      const allGroups = ["Main", ...groupNames];
      const groupIndex = allGroups.indexOf(group);
      const previousGroup = groupIndex > 0 ? allGroups[groupIndex - 1] : "Main";

      const updatedIngredients = [...ingredients];
      updatedIngredients[ingredientIndex] = {
        ...ingredient,
        group: previousGroup === "Main" ? undefined : previousGroup,
      };
      onIngredientsChange(updatedIngredients);
    } else {
      // Swap with previous ingredient in same group
      const prevIngredient = groupIngredients[indexInGroup - 1];
      const prevIndex = ingredients.indexOf(prevIngredient);

      const updatedIngredients = [...ingredients];
      [updatedIngredients[ingredientIndex], updatedIngredients[prevIndex]] = [
        updatedIngredients[prevIndex],
        updatedIngredients[ingredientIndex],
      ];
      onIngredientsChange(updatedIngredients);
    }
  };

  // Move ingredient down within its group or to next group
  const moveIngredientDown = (ingredientIndex: number) => {
    const ingredient = ingredients[ingredientIndex];
    const group = ingredient.group || "Main";

    // Find all ingredients in the same group
    const groupIngredients = ingredients.filter(
      (ing: Ingredient) => (ing.group || "Main") === group
    );
    const indexInGroup = groupIngredients.indexOf(ingredient);

    if (indexInGroup === groupIngredients.length - 1) {
      // Last in group - move to next group (first position)
      const allGroups = ["Main", ...groupNames];
      const groupIndex = allGroups.indexOf(group);
      const nextGroup = groupIndex < allGroups.length - 1 ? allGroups[groupIndex + 1] : null;

      if (nextGroup) {
        const updatedIngredients = [...ingredients];
        updatedIngredients[ingredientIndex] = {
          ...ingredient,
          group: nextGroup === "Main" ? undefined : nextGroup,
        };
        onIngredientsChange(updatedIngredients);
      }
    } else {
      // Swap with next ingredient in same group
      const nextIngredient = groupIngredients[indexInGroup + 1];
      const nextIndex = ingredients.indexOf(nextIngredient);

      const updatedIngredients = [...ingredients];
      [updatedIngredients[ingredientIndex], updatedIngredients[nextIndex]] = [
        updatedIngredients[nextIndex],
        updatedIngredients[ingredientIndex],
      ];
      onIngredientsChange(updatedIngredients);
    }
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

    setAddingToGroup(null);
  };

  // Edit an existing ingredient
  const editIngredient = (index: number, updatedIngredient: Ingredient) => {
    const updatedIngredients = [...ingredients];
    updatedIngredients[index] = updatedIngredient;
    onIngredientsChange(updatedIngredients);
    setEditingIndex(null);
  };

  return (
    <View className="gap-2">
      {/* Section Header */}
      <Text
        className="font-playfair-bold mb-4 text-2xl uppercase tracking-wide text-foreground-heading"
        style={{ fontFamily: "PlayfairDisplay_700Bold" }}
      >
        Ingredients
      </Text>

      {/* Group Management */}
      <View className="mb-6">
        <Text className="font-bold shrink-0 text-sm uppercase tracking-widest text-foreground-tertiary mb-2">
          Ingredient Groups
        </Text>

        {/* Add Group Input */}
        <View className={`mb-3 flex-row ${isTablet ? "gap-4" : "gap-2"}`}>
          <View className="flex-1">
            <RNTextInput
              value={newGroupName}
              onChangeText={setNewGroupName}
              onSubmitEditing={addGroup}
              placeholder="e.g., For the sauce, For the dough..."
              placeholderTextColor="#a89f8d"
              className="rounded-xl border border-border-button bg-white px-4 py-3.5 text-base text-foreground"
              returnKeyType="done"
              autoCapitalize="words"
            />
          </View>

          <ShadowItem
            variant="primary"
            className={`items-center justify-center rounded-xl px-4 ${
              !newGroupName.trim() || groupNames.includes(newGroupName.trim()) ? "opacity-50" : ""
            }`}
            onPress={addGroup}
            disabled={!newGroupName.trim() || groupNames.includes(newGroupName.trim())}
          >
            <PlusIcon size={20} color="#FFFFFF" weight="bold" />
          </ShadowItem>
        </View>

        {/* Current Groups (excluding Main) */}
        {groupNames.length > 0 && (
          <View className="flex-row flex-wrap gap-2">
            {groupNames.map((group) => (
              <ShadowItem
                key={group}
                className="flex-row items-center gap-2 rounded-full bg-surface-elevated px-3 py-2"
              >
                <Text className="text-sm text-foreground">{group}</Text>
                <Pressable onPress={() => deleteGroup(group)}>
                  <XIcon size={16} color="#3a3226" weight="bold" />
                </Pressable>
              </ShadowItem>
            ))}
          </View>
        )}
      </View>

      {/* Ingredients by Group */}
      <View className="gap-6">
        {["Main", ...groupNames].map((groupName) => {
          const groupIngredients = groupedIngredients[groupName] || [];
          const groupIndex = groupNames.indexOf(groupName);
          const isLastGroup = groupIndex === groupNames.length - 1;

          return (
            <View key={groupName}>
              {/* Group Header (not shown for "Main") */}
              {groupName !== "Main" && (
                <View className="mb-3 mt-2 flex-row items-center gap-3">
                  {/* Group reorder arrows */}
                  <View className="flex-row gap-1">
                    <Pressable
                      onPress={() => moveGroupUp(groupName)}
                      disabled={groupIndex === 0}
                      className={groupIndex === 0 ? "opacity-30" : ""}
                    >
                      <CaretUpIcon size={16} color="#3a3226" weight="bold" />
                    </Pressable>
                    <Pressable
                      onPress={() => moveGroupDown(groupName)}
                      disabled={isLastGroup}
                      className={isLastGroup ? "opacity-30" : ""}
                    >
                      <CaretDownIcon size={16} color="#3a3226" weight="bold" />
                    </Pressable>
                  </View>

                  <Text className="font-bold shrink-0 text-xs uppercase tracking-widest text-foreground-tertiary">
                    {groupName}
                  </Text>
                  <View className="h-px flex-1 bg-border-light" />
                </View>
              )}

              {/* Ingredients in this group */}
              {groupIngredients.length > 0 ? (
                <View className="gap-2">
                  {groupIngredients.map((ingredient: Ingredient) => {
                    const ingredientIndex = ingredients.indexOf(ingredient);
                    const isInMainGroup = (ingredient.group || "Main") === "Main";
                    const groupIngs = ingredients.filter(
                      (ing: Ingredient) => (ing.group || "Main") === (ingredient.group || "Main")
                    );
                    const indexInGroup = groupIngs.indexOf(ingredient);
                    const isFirst = indexInGroup === 0;
                    const isLast = indexInGroup === groupIngs.length - 1;
                    const allGroups = ["Main", ...groupNames];
                    const currentGroupIndex = allGroups.indexOf(ingredient.group || "Main");
                    const isLastGroup = currentGroupIndex === allGroups.length - 1;
                    const isEditing = editingIndex === ingredientIndex;

                    if (isEditing) {
                      return (
                        <IngredientForm
                          key={ingredientIndex}
                          mode="edit"
                          groupName={ingredient.group || "Main"}
                          ingredient={ingredient}
                          onSave={(updated: Ingredient) => editIngredient(ingredientIndex, updated)}
                          onCancel={() => setEditingIndex(null)}
                        />
                      );
                    }

                    return (
                      <ShadowItem
                        key={ingredientIndex}
                        className="flex-row items-center gap-3 rounded-xl p-3"
                      >
                        {/* Up/Down Arrows */}
                        <View className="gap-1">
                          <Pressable
                            onPress={() => moveIngredientUp(ingredientIndex)}
                            disabled={isInMainGroup && isFirst}
                            className={isInMainGroup && isFirst ? "opacity-30" : ""}
                          >
                            <CaretUpIcon size={20} color="#3a3226" weight="bold" />
                          </Pressable>
                          <Pressable
                            onPress={() => moveIngredientDown(ingredientIndex)}
                            disabled={isLast && isLastGroup}
                            className={isLast && isLastGroup ? "opacity-30" : ""}
                          >
                            <CaretDownIcon size={20} color="#3a3226" weight="bold" />
                          </Pressable>
                        </View>

                        {/* Ingredient Display - Clickable to edit */}
                        <Pressable
                          className="flex-1"
                          onPress={() => setEditingIndex(ingredientIndex)}
                        >
                          <Text className="text-base text-foreground">
                            {ingredient.quantity && `${ingredient.quantity} `}
                            {ingredient.unit && `${ingredient.unit} `}
                            {ingredient.name}
                            {ingredient.notes && ` (${ingredient.notes})`}
                          </Text>
                        </Pressable>

                        {/* Delete Button */}
                        <Pressable onPress={() => removeIngredient(ingredientIndex)}>
                          <XIcon size={20} color="#3a3226" weight="bold" />
                        </Pressable>
                      </ShadowItem>
                    );
                  })}
                </View>
              ) : (
                /* Empty group state */
                groupName !== "Main" && (
                  <View className="rounded-xl border border-dashed border-border-light bg-surface-elevated p-4">
                    <Text className="text-center text-sm text-foreground-muted italic">
                      No ingredients in this group yet
                    </Text>
                  </View>
                )
              )}

              {/* Add Ingredient Form or Button */}
              <View className="mt-3">
                {addingToGroup === groupName ? (
                  <IngredientForm
                    mode="add"
                    groupName={groupName}
                    onSave={(ingredient: Ingredient) => addIngredient(ingredient, groupName)}
                    onCancel={() => setAddingToGroup(null)}
                  />
                ) : (
                  <Pressable onPress={() => setAddingToGroup(groupName)}>
                    <ShadowItem className="flex-row items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border-light bg-white py-3">
                      <PlusIcon size={20} color="#334d43" weight="bold" />
                      <Text className="text-sm font-semibold text-foreground">
                        Add Ingredient{groupName !== "Main" && ` to ${groupName}`}
                      </Text>
                    </ShadowItem>
                  </Pressable>
                )}
              </View>
            </View>
          );
        })}
      </View>

      {ingredientsError && (
        <Text className="mt-1.5 text-sm text-red-600">{ingredientsError.message}</Text>
      )}
    </View>
  );
}
