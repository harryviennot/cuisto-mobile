import React, { useState, useEffect, useMemo } from "react";
import {
  View,
  Text,
  LayoutAnimation,
  Platform,
  UIManager,
} from "react-native";
import { Control, useController } from "react-hook-form";
import { DraggableList } from "../../DragAndDrop/DraggableList";
import { RenderItemParams } from "../../DragAndDrop/types";
import * as Haptics from "expo-haptics";
import type { RecipeEditFormData } from "@/schemas/recipe.schema";
import type { Instruction } from "@/types/recipe";

import { ExpandableInstructionForm } from "./ExpandableInstructionForm";
import { InstructionItem } from "./InstructionItem";
import { GroupHeader } from "./GroupHeader";
import { FormGroupInput } from "@/components/forms/FormGroupInput";

// Enable LayoutAnimation on Android
if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface RecipeInstructionsFormProps {
  control: Control<RecipeEditFormData, any>;
}

// Type for flat list items (either group header or instruction)
type FlatListItem =
  | { type: "header"; groupName: string; id: string }
  | { type: "instruction"; instruction: Instruction; instructionId: string; id: string };

export function RecipeInstructionsForm({ control }: RecipeInstructionsFormProps) {
  const {
    field: { value: instructions, onChange: onInstructionsChange },
    fieldState: { error: instructionsError },
  } = useController({ control, name: "instructions" });

  // Safety check: ensure instructions is always an array
  const instructionsList = Array.isArray(instructions) ? instructions : [];

  const [newGroupName, setNewGroupName] = useState("");
  const [groupNames, setGroupNames] = useState<string[]>([]);
  const [addingToGroup, setAddingToGroup] = useState<string | null>(null);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  // Helper function to recalculate step numbers for all instructions
  const recalculateStepNumbers = (instructionsList: Instruction[]): Instruction[] => {
    return instructionsList.map((instruction, index) => ({
      ...instruction,
      step_number: index + 1,
    }));
  };

  // Transform instructions into flat list structure with headers
  const flatData = useMemo(() => {
    const allGroups = ["Main", ...groupNames];
    const items: FlatListItem[] = [];

    allGroups.forEach((groupName) => {
      const groupInstructions = instructionsList.filter(
        (inst: Instruction) => (inst.group || "Main") === groupName
      );

      // Add header for all non-Main groups (even if empty)
      if (groupName !== "Main") {
        items.push({
          type: "header",
          groupName,
          id: `header-${groupName}`,
        });
      }

      // Add instructions for this group
      groupInstructions.forEach((instruction: Instruction) => {
        // Create unique stable ID using global index to prevent duplicates
        const globalIndex = instructionsList.indexOf(instruction);
        const instructionId = `instruction-${globalIndex}-${instruction.step_number}-${instruction.title}`;
        items.push({
          type: "instruction",
          instruction,
          instructionId,
          id: instructionId,
        });
      });
    });

    return items;
  }, [instructionsList, groupNames]);

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

  // Initialize group names from instructions on mount
  useEffect(() => {
    const seen = new Set<string>();
    const groups: string[] = [];

    instructionsList.forEach((inst: Instruction) => {
      const group = inst.group || "Main";
      if (group !== "Main" && !seen.has(group)) {
        seen.add(group);
        groups.push(group);
      }
    });

    setGroupNames(groups);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Handle drag end - reconstruct instructions array from flat list
  const handleDragEnd = ({ data }: { data: FlatListItem[] }) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    // Extract only instruction items and reconstruct array
    const newInstructions: Instruction[] = [];
    let currentGroup: string | undefined = undefined;

    data.forEach((item) => {
      if (item.type === "header") {
        currentGroup = item.groupName;
      } else if (item.type === "instruction") {
        // Update instruction's group based on which header it's under
        newInstructions.push({
          ...item.instruction,
          group: currentGroup === "Main" ? undefined : currentGroup,
        });
      }
    });

    // Recalculate step numbers after reordering
    const reorderedInstructions = recalculateStepNumbers(newInstructions);
    onInstructionsChange(reorderedInstructions);
  };

  // Add a new group
  const addGroup = () => {
    const trimmedGroupName = newGroupName.trim();
    if (trimmedGroupName && !groupNames.includes(trimmedGroupName) && trimmedGroupName !== "Main") {
      setGroupNames([...groupNames, trimmedGroupName]);
      setNewGroupName("");
    }
  };

  // Delete a group and move its instructions to the previous group
  const deleteGroup = (groupToDelete: string) => {
    if (groupToDelete === "Main") return;

    const allGroups = ["Main", ...groupNames];
    const groupIndex = allGroups.indexOf(groupToDelete);
    const previousGroup = groupIndex > 0 ? allGroups[groupIndex - 1] : "Main";

    const updatedInstructions = instructionsList.map((inst: Instruction) => {
      if (inst.group === groupToDelete) {
        return { ...inst, group: previousGroup === "Main" ? undefined : previousGroup };
      }
      return inst;
    });

    setGroupNames(groupNames.filter((g) => g !== groupToDelete));
    onInstructionsChange(updatedInstructions);
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

    // Reorder instructions array to match new group order
    const allGroups = ["Main", ...newGroupNames];
    const reorderedInstructions: Instruction[] = [];

    allGroups.forEach((group) => {
      const groupInstructions = instructionsList.filter(
        (inst: Instruction) => (inst.group || "Main") === group
      );
      reorderedInstructions.push(...groupInstructions);
    });

    // Recalculate step numbers after reordering
    onInstructionsChange(recalculateStepNumbers(reorderedInstructions));
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

    // Reorder instructions array to match new group order
    const allGroups = ["Main", ...newGroupNames];
    const reorderedInstructions: Instruction[] = [];

    allGroups.forEach((group) => {
      const groupInstructions = instructionsList.filter(
        (inst: Instruction) => (inst.group || "Main") === group
      );
      reorderedInstructions.push(...groupInstructions);
    });

    // Recalculate step numbers after reordering
    onInstructionsChange(recalculateStepNumbers(reorderedInstructions));
  };

  // Remove an instruction
  const removeInstruction = (index: number) => {
    const updatedInstructions = instructionsList.filter((_: any, i: number) => i !== index);
    // Recalculate step numbers after removal
    onInstructionsChange(recalculateStepNumbers(updatedInstructions));
  };

  // Add a new instruction to a specific group
  const addInstruction = (
    instructionData: Omit<Instruction, "step_number">,
    groupName: string
  ) => {
    // Find the last instruction in this group to insert after it
    const groupInstructions = instructionsList.filter(
      (inst: Instruction) => (inst.group || "Main") === groupName
    );

    // Create instruction with temporary step number (will be recalculated)
    const newInstruction: Instruction = {
      ...instructionData,
      step_number: instructionsList.length + 1, // Temporary
    };

    if (groupInstructions.length === 0) {
      // No instructions in this group yet - add at the appropriate position
      const allGroups = ["Main", ...groupNames];
      const groupIndex = allGroups.indexOf(groupName);

      // Find the index to insert at (after the last instruction of the previous group)
      let insertIndex = 0;
      for (let i = 0; i < groupIndex; i++) {
        const prevGroupName = allGroups[i];
        const prevGroupInstructions = instructionsList.filter(
          (inst: Instruction) => (inst.group || "Main") === prevGroupName
        );
        insertIndex += prevGroupInstructions.length;
      }

      const updatedInstructions = [...instructionsList];
      updatedInstructions.splice(insertIndex, 0, newInstruction);
      onInstructionsChange(recalculateStepNumbers(updatedInstructions));
    } else {
      // Add after the last instruction in this group
      const lastInstruction = groupInstructions[groupInstructions.length - 1];
      const lastIndex = instructionsList.indexOf(lastInstruction);

      const updatedInstructions = [...instructionsList];
      updatedInstructions.splice(lastIndex + 1, 0, newInstruction);
      onInstructionsChange(recalculateStepNumbers(updatedInstructions));
    }

    setAddingToGroupAnimated(null);
  };

  // Edit an existing instruction
  const editInstruction = (
    index: number,
    updatedInstructionData: Omit<Instruction, "step_number">
  ) => {
    const updatedInstructions = [...instructionsList];
    // Keep the same step_number when editing
    updatedInstructions[index] = {
      ...updatedInstructionData,
      step_number: updatedInstructions[index].step_number,
    };
    onInstructionsChange(updatedInstructions);
    setEditingIndexAnimated(null);
  };

  // Calculate next step number for add form
  const nextStepNumber = instructionsList.length + 1;

  // Render individual item in the draggable list
  const renderDraggableItem = ({
    item,
    drag,
    isActive,
    ...rest
  }: RenderItemParams<FlatListItem>) => {
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

    // Render instruction item (draggable)
    const { instruction } = item;

    // Find the current index in the instructions array
    const currentIndex = instructionsList.findIndex(
      (inst: Instruction) =>
        inst.step_number === instruction.step_number &&
        inst.title === instruction.title &&
        inst.description === instruction.description &&
        inst.group === instruction.group
    );

    const isEditing = editingIndex === currentIndex && currentIndex !== -1;

    if (isEditing) {
      return (
        <ExpandableInstructionForm
          mode="edit"
          groupName={instruction.group || "Main"}
          instruction={instruction}
          isExpanded={isEditing}
          onToggle={() => setEditingIndexAnimated(null)}
          onSave={(updated) => editInstruction(currentIndex, updated)}
          nextStepNumber={instruction.step_number}
        />
      );
    }

    return (
      <InstructionItem
        instruction={instruction}
        isActive={isActive}
        onEdit={() => currentIndex !== -1 && setEditingIndexAnimated(currentIndex)}
        onDelete={() => currentIndex !== -1 && removeInstruction(currentIndex)}
        internalProps={internalProps}
      />
    );
  };

  return (
    <View className="mt-8">
      {/* Section Header */}
      <Text
        className="mb-4 font-playfair-bold text-2xl uppercase tracking-wide text-foreground-heading"
        style={{ fontFamily: "PlayfairDisplay_700Bold" }}
      >
        Instructions
      </Text>

      {/* Group Management */}
      <FormGroupInput
        label="Instruction Groups"
        placeholder="e.g., Making the sauce, Assembling..."
        items={groupNames}
        newItemValue={newGroupName}
        onNewItemChange={setNewGroupName}
        onAddItem={addGroup}
        onRemoveItem={deleteGroup}
        autoCapitalize="words"
        className="mb-6"
      />

      {/* Instructions by Group - Drag and Drop List */}
      <View>
        {flatData.length > 0 ? (
          <View className="mb-2">
            <DraggableList
              data={flatData}
              onDragEnd={handleDragEnd}
              keyExtractor={(item: FlatListItem) => item.id}
              renderItem={renderDraggableItem}
              activationDelay={100}
              autoscrollThreshold={50}
              autoscrollSpeed={10}
            />
          </View>
        ) : (
          <View className="mb-4 rounded-2xl border-2 border-dashed border-border-light bg-surface p-8">
            <Text className="text-center text-base text-foreground-muted">
              No instructions yet
            </Text>
            <Text className="mt-1 text-center text-sm text-foreground-tertiary">
              Add your first step below to get started
            </Text>
          </View>
        )}

        {/* Single Add Instruction Form at the end */}
        <View className="mt-2">
          <ExpandableInstructionForm
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
            onSave={(instructionData) =>
              addInstruction(
                instructionData,
                groupNames.length > 0 ? groupNames[groupNames.length - 1] : "Main"
              )
            }
            nextStepNumber={nextStepNumber}
          />
        </View>
      </View>

      {instructionsError && (
        <Text className="mt-1.5 text-sm text-red-600">{instructionsError.message}</Text>
      )}
    </View>
  );
}
