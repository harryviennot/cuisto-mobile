import React, { useState } from "react";
import { View, Text, Pressable, TextInput as RNTextInput } from "react-native";
import { PlusIcon, CheckIcon, ClockIcon, AlarmIcon } from "phosphor-react-native";
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
    <View className="mb-3 w-full">
      {/* Collapsed state - button */}
      {!isExpanded && (
        <ShadowItem onPress={onToggle} className="flex-row items-center justify-center gap-2.5 rounded-xl border-2 border-dashed border-border-light bg-transparent py-4">
          <PlusIcon size={20} color="#334d43" weight="bold" />
          <Text className="text-base font-semibold text-foreground">
            {mode === "add"
              ? `Add Step`
              : instruction?.title || "Edit Instruction"}
          </Text>
        </ShadowItem>
      )}

      {/* Expanded state - form */}
      {isExpanded && (
        <ShadowItem className="w-full rounded-2xl border-primary bg-white">
          <View className="w-full p-4">
            {/* Header with Timer */}
            <View className="mb-4 w-full flex-row items-center justify-between">
              <View className="flex-row items-center gap-2.5 flex-shrink">
                <View className="h-8 w-8 items-center justify-center rounded-full bg-primary">
                  <Text className="text-sm font-bold text-white">{nextStepNumber}</Text>
                </View>
                <Text className="text-base font-bold text-foreground-heading">
                  {displayTitle}
                </Text>
              </View>

              {/* Timer Input (Optional) - Top Right */}
              <View className="flex-row items-center gap-1.5 flex-shrink-0">
                <View className="rounded-lg bg-primary/5 p-1.5">
                  <AlarmIcon size={20} color="#334d43" weight="bold" />
                </View>
                <View style={{ width: isTablet ? 60 : 50 }}>
                  <RNTextInput
                    value={timerMinutes}
                    onChangeText={setTimerMinutes}
                    placeholder="0"
                    placeholderTextColor="#a8a29e"
                    className="w-full rounded-lg border border-border-button bg-input-background px-2 py-1.5 text-sm text-foreground-heading"
                    keyboardType="numeric"
                    returnKeyType="done"
                    onSubmitEditing={handleSave}
                  />
                </View>
                <Text className="text-xs text-foreground-muted">min</Text>
              </View>
            </View>

            {/* Title Input */}
            <View className="mb-4 w-full">
              <Text className="mb-2 text-sm font-semibold text-foreground-secondary">
                Title *
              </Text>
              <RNTextInput
                value={title}
                onChangeText={setTitle}
                placeholder="e.g., Preheat the oven"
                placeholderTextColor="#a8a29e"
                className="w-full rounded-xl border border-border-button bg-input-background px-4 py-3.5 text-base text-foreground-heading"
                autoCapitalize="sentences"
                returnKeyType="next"
              />
            </View>

            {/* Description Input - Multiline */}
            <View className="mb-5 w-full">
              <Text className="mb-2 text-sm font-semibold text-foreground-secondary">
                Instructions *
              </Text>
              <RNTextInput
                value={description}
                onChangeText={setDescription}
                placeholder="Describe the step in detail..."
                placeholderTextColor="#a8a29e"
                className="w-full min-h-[100px] rounded-xl border border-border-button bg-input-background px-4 py-3.5 text-base leading-6 text-foreground-heading"
                autoCapitalize="sentences"
                multiline
                textAlignVertical="top"
                returnKeyType="default"
              />
            </View>

            {/* Action Buttons */}
            <View className={`w-full flex-row ${isTablet ? "gap-3" : "gap-3"}`}>
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
