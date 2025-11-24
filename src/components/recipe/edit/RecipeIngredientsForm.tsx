import React, { useState, useEffect, useMemo } from "react";
import {
  View,
  Text,
  Pressable,
  TextInput as RNTextInput,
  LayoutAnimation,
  Platform,
  UIManager,
} from "react-native";
import { Control, useController } from "react-hook-form";
import { XIcon, PlusIcon, CaretUpIcon, CaretDownIcon, CheckIcon } from "phosphor-react-native";
import DraggableFlatList, {
  ScaleDecorator,
  RenderItemParams,
} from "react-native-draggable-flatlist";
import * as Haptics from "expo-haptics";
import { ShadowItem } from "@/components/ShadowedSection";
import type { RecipeEditFormData } from "@/schemas/recipe.schema";
import type { Ingredient } from "@/types/recipe";
import { useDeviceType } from "@/hooks/useDeviceType";

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

interface ExpandableIngredientFormProps {
  mode: "add" | "edit";
  groupName: string;
  ingredient?: Ingredient;
  isExpanded: boolean;
  onToggle: () => void;
  onSave: (ingredient: Ingredient) => void;
}

function ExpandableIngredientForm({
  mode,
  groupName,
  ingredient,
  isExpanded,
  onToggle,
  onSave,
}: ExpandableIngredientFormProps) {
  const { isTablet } = useDeviceType();
  const [name, setName] = useState(ingredient?.name || "");
  const [quantity, setQuantity] = useState(ingredient?.quantity || "");
  const [unit, setUnit] = useState(ingredient?.unit || "");
  const [notes, setNotes] = useState(ingredient?.notes || "");

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

  return (
    <View>
      {/* Collapsed state - button */}
      {!isExpanded && (
        <Pressable onPress={onToggle}>
          <ShadowItem className="flex-row items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border-light bg-white py-3">
            <PlusIcon size={20} color="#334d43" weight="bold" />
            <Text className="text-sm font-semibold text-foreground">
              {mode === "add" ? "Add Ingredient" : ingredient?.name || "Edit Ingredient"}
            </Text>
          </ShadowItem>
        </Pressable>
      )}

      {/* Expanded state - form */}
      {isExpanded && (
        <ShadowItem className="rounded-xl border-2 border-primary/30 bg-primary/5 p-4">
          <Text className="mb-3 text-sm font-bold uppercase tracking-widest text-primary">
            {mode === "add" ? `Add Ingredient` : "Edit Ingredient"}
          </Text>

          {/* Main Row: Quantity, Unit, Name */}
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

            {/* Ingredient Name */}
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

          {/* Notes */}
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
            <Pressable onPress={onToggle} className="flex-1">
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
      )}
    </View>
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

  // Render individual item in the draggable list
  const renderDraggableItem = ({ item, drag, isActive }: RenderItemParams<FlatListItem>) => {
    // Render group header (non-draggable)
    if (item.type === "header") {
      const groupIndex = groupNames.indexOf(item.groupName);
      const isLastGroup = groupIndex === groupNames.length - 1;

      return (
        <View className="mb-3 mt-2 flex-row items-center gap-3">
          {/* Group reorder arrows */}
          <View className="flex-row gap-1">
            <Pressable
              hitSlop={4}
              onPress={() => moveGroupUp(item.groupName)}
              disabled={groupIndex === 0}
              className={groupIndex === 0 ? "opacity-30" : ""}
            >
              <CaretUpIcon size={16} color="#3a3226" weight="bold" />
            </Pressable>
            <Pressable
              hitSlop={4}
              onPress={() => moveGroupDown(item.groupName)}
              disabled={isLastGroup}
              className={isLastGroup ? "opacity-30" : ""}
            >
              <CaretDownIcon size={16} color="#3a3226" weight="bold" />
            </Pressable>
          </View>

          <Text className="font-bold shrink-0 text-xs uppercase tracking-widest text-foreground-tertiary">
            {item.groupName}
          </Text>
          <View className="h-px flex-1 bg-border-light" />
        </View>
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
      <ScaleDecorator>
        <Pressable
          onLongPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            drag();
          }}
          disabled={isActive}
          delayLongPress={500}
        >
          <ShadowItem
            className={`mb-2 flex-row items-center gap-3 rounded-xl p-3 pr-4 ${
              isActive ? "border-2 border-primary bg-primary/5" : ""
            }`}
            // style={
            //   isActive
            //     ? {
            //         shadowColor: "#334d43",
            //         shadowOffset: { width: 0, height: 8 },
            //         shadowOpacity: 0.3,
            //         shadowRadius: 12,
            //         elevation: 8,
            //       }
            //     : undefined
            // }
          >
            {/* Drag Handle Icon */}
            <View className={`${isActive ? "opacity-60" : "opacity-40"}`}>
              <View className="flex-col gap-0.5">
                <View className="flex-row gap-0.5">
                  <View className="h-1 w-1 rounded-full bg-foreground" />
                  <View className="h-1 w-1 rounded-full bg-foreground" />
                </View>
                <View className="flex-row gap-0.5">
                  <View className="h-1 w-1 rounded-full bg-foreground" />
                  <View className="h-1 w-1 rounded-full bg-foreground" />
                </View>
                <View className="flex-row gap-0.5">
                  <View className="h-1 w-1 rounded-full bg-foreground" />
                  <View className="h-1 w-1 rounded-full bg-foreground" />
                </View>
              </View>
            </View>

            {/* Ingredient Display - Clickable to edit */}
            <Pressable
              className="flex-1"
              onPress={() => currentIndex !== -1 && setEditingIndexAnimated(currentIndex)}
            >
              <Text className="text-base text-foreground">
                {ingredient.quantity && `${ingredient.quantity} `}
                {ingredient.unit && `${ingredient.unit} `}
                {ingredient.name}
                {ingredient.notes && ` (${ingredient.notes})`}
              </Text>
            </Pressable>

            {/* Delete Button */}
            <Pressable
              hitSlop={8}
              onPress={() => currentIndex !== -1 && removeIngredient(currentIndex)}
            >
              <XIcon size={20} color="#3a3226" weight="bold" />
            </Pressable>
          </ShadowItem>
        </Pressable>
      </ScaleDecorator>
    );
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

      {/* Ingredients by Group - Drag and Drop List */}
      <View className="">
        {flatData.length > 0 ? (
          <DraggableFlatList
            data={flatData}
            onDragEnd={handleDragEnd}
            keyExtractor={(item) => item.id}
            renderItem={renderDraggableItem}
            containerStyle={{ flex: 1 }}
            scrollEnabled={false}
          />
        ) : (
          <View className="rounded-xl border border-dashed border-border-light bg-surface-elevated p-4">
            <Text className="text-center text-sm text-foreground-muted italic">
              No ingredients yet. Add your first ingredient below.
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
      </View>

      {ingredientsError && (
        <Text className="mt-1.5 text-sm text-red-600">{ingredientsError.message}</Text>
      )}
    </View>
  );
}
