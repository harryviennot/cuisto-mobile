import React, { useState } from "react";
import { View, Text, Pressable, TextInput as RNTextInput } from "react-native";
import { PlusIcon, CheckIcon, ClockIcon } from "phosphor-react-native";
import { ShadowItem } from "@/components/ShadowedSection";
import { useDeviceType } from "@/hooks/useDeviceType";
import type { Instruction } from "@/types/recipe";

interface ExpandableInstructionFormProps {
  mode: "add" | "edit";
  groupName: string;
  instruction?: Instruction;
  isExpanded: boolean;
  onToggle: () => void;
  onSave: (instruction: Omit<Instruction, "step_number">) => void;
  nextStepNumber: number;
}

export function ExpandableInstructionForm({
  mode,
  groupName,
  instruction,
  isExpanded,
  onToggle,
  onSave,
  nextStepNumber,
}: ExpandableInstructionFormProps) {
  const { isTablet } = useDeviceType();
  const [title, setTitle] = useState(instruction?.title || "");
  const [description, setDescription] = useState(instruction?.description || "");
  const [timerMinutes, setTimerMinutes] = useState(
    instruction?.timer_minutes?.toString() || ""
  );

  const handleSave = () => {
    if (!title.trim() || !description.trim()) return;

    const savedInstruction: Omit<Instruction, "step_number"> = {
      title: title.trim(),
      description: description.trim(),
      timer_minutes: timerMinutes.trim() ? parseInt(timerMinutes.trim()) : undefined,
      group:
        mode === "edit" && instruction?.group
          ? instruction.group
          : groupName === "Main"
            ? undefined
            : groupName,
    };

    onSave(savedInstruction);

    // Reset form only in add mode
    if (mode === "add") {
      setTitle("");
      setDescription("");
      setTimerMinutes("");
    }
  };

  const displayTitle =
    mode === "add"
      ? `Step ${nextStepNumber}`
      : `Edit Step ${instruction?.step_number}`;

  return (
    <View className="mb-3">
      {/* Collapsed state - button */}
      {!isExpanded && (
        <Pressable onPress={onToggle}>
          <ShadowItem className="flex-row items-center justify-center gap-2.5 rounded-2xl border-2 border-dashed border-border-light bg-white py-4">
            <View className="rounded-full bg-primary/10 p-1.5">
              <PlusIcon size={18} color="#334d43" weight="bold" />
            </View>
            <Text className="text-base font-semibold text-foreground">
              {mode === "add"
                ? `Add Step ${nextStepNumber}`
                : instruction?.title || "Edit Instruction"}
            </Text>
          </ShadowItem>
        </Pressable>
      )}

      {/* Expanded state - form */}
      {isExpanded && (
        <ShadowItem className="rounded-2xl border-2 border-primary/20 bg-white">
          <View className="p-5">
            {/* Header */}
            <View className="mb-4 flex-row items-center gap-2.5">
              <View className="h-8 w-8 items-center justify-center rounded-full bg-primary">
                <Text className="text-sm font-bold text-white">{nextStepNumber}</Text>
              </View>
              <Text className="text-base font-bold text-foreground-heading">
                {displayTitle}
              </Text>
            </View>

            {/* Title Input */}
            <View className="mb-4">
              <Text className="mb-2 text-sm font-semibold text-foreground-secondary">
                Title *
              </Text>
              <RNTextInput
                value={title}
                onChangeText={setTitle}
                placeholder="e.g., Preheat the oven"
                placeholderTextColor="#a89f8d"
                className="rounded-xl border border-border-button bg-surface px-4 py-3.5 text-base text-foreground"
                autoCapitalize="sentences"
                returnKeyType="next"
              />
            </View>

            {/* Description Input - Multiline */}
            <View className="mb-4">
              <Text className="mb-2 text-sm font-semibold text-foreground-secondary">
                Instructions *
              </Text>
              <RNTextInput
                value={description}
                onChangeText={setDescription}
                placeholder="Describe the step in detail..."
                placeholderTextColor="#a89f8d"
                className="min-h-[100px] rounded-xl border border-border-button bg-surface px-4 py-3.5 text-base leading-6 text-foreground"
                autoCapitalize="sentences"
                multiline
                textAlignVertical="top"
                returnKeyType="default"
              />
            </View>

            {/* Timer Input (Optional) */}
            <View className="mb-5">
              <Text className="mb-2 text-sm font-semibold text-foreground-secondary">
                Timer (optional)
              </Text>
              <View className="flex-row items-center gap-2">
                <View className="rounded-xl bg-primary/5 p-2">
                  <ClockIcon size={20} color="#334d43" weight="bold" />
                </View>
                <View className="flex-1" style={{ maxWidth: isTablet ? 140 : 120 }}>
                  <RNTextInput
                    value={timerMinutes}
                    onChangeText={setTimerMinutes}
                    placeholder="30"
                    placeholderTextColor="#a89f8d"
                    className="rounded-xl border border-border-button bg-surface px-4 py-3.5 text-base text-foreground"
                    keyboardType="numeric"
                    returnKeyType="done"
                    onSubmitEditing={handleSave}
                  />
                </View>
                <Text className="text-sm text-foreground-muted">minutes</Text>
              </View>
            </View>

            {/* Action Buttons */}
            <View className={`flex-row ${isTablet ? "gap-3" : "gap-3"}`}>
              <Pressable onPress={onToggle} className="flex-1">
                <ShadowItem className="items-center rounded-xl border border-border-button bg-white py-3.5">
                  <Text className="text-base font-semibold text-foreground">Cancel</Text>
                </ShadowItem>
              </Pressable>
              <Pressable
                onPress={handleSave}
                className="flex-1"
                disabled={!title.trim() || !description.trim()}
              >
                <ShadowItem
                  variant="primary"
                  className={`flex-row items-center justify-center gap-2 rounded-xl py-3.5 ${!title.trim() || !description.trim() ? "opacity-50" : ""
                    }`}
                >
                  <CheckIcon size={18} color="#FFFFFF" weight="bold" />
                  <Text className="text-base font-semibold text-white">
                    {mode === "add" ? "Add Step" : "Save Changes"}
                  </Text>
                </ShadowItem>
              </Pressable>
            </View>
          </View>
        </ShadowItem>
      )}
    </View>
  );
}
