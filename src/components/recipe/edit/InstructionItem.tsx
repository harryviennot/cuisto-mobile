import React from "react";
import { View, Text, Pressable } from "react-native";
import { TrashIcon, DotsSixVerticalIcon, AlarmIcon } from "phosphor-react-native";
import { DraggableItem } from "@/components/DragAndDrop";
import { ShadowItem } from "@/components/ShadowedSection";
import type { Instruction } from "@/types/recipe";
import { GestureDetector } from "react-native-gesture-handler";

interface InstructionItemProps {
  instruction: Instruction;
  isActive: boolean;
  onEdit: () => void;
  onDelete: () => void;
  internalProps: any;
}

export function InstructionItem({
  instruction,
  isActive,
  onEdit,
  onDelete,
  internalProps,
}: InstructionItemProps) {
  const { panGesture, ...draggableProps } = internalProps || {};

  return (
    <DraggableItem isActive={isActive} {...draggableProps}>
      <View className="mb-3" style={{ minHeight: 120 }}>
        <ShadowItem
          className={`rounded-2xl border bg-white ${isActive ? "border-2 border-primary bg-primary/5" : "border-border-light"
            }`}
        >
          <View className="flex-row items-start gap-3 p-3" style={{ minHeight: 120 }}>
            {/* Left side: Drag Handle */}
            <View className="items-center justify-between">
              <View className="h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary">
                <Text className="text-sm font-bold text-white">{instruction.step_number}</Text>
              </View>
              <GestureDetector gesture={panGesture}>
                <View className="flex-1 items-center justify-center w-8">
                  <DotsSixVerticalIcon size={20} color="#6b5e4c" weight="bold" />
                </View>
              </GestureDetector>
              <View className="h-6 w-8" />
            </View>
            {/* Step Number Badge */}


            {/* Content - clickable to edit */}
            <Pressable onPress={onEdit} className="flex-1 h-full ">
              <View className="gap-2 mt-1">
                {/* Title and Timer Row */}
                <View className="flex-row gap-4">
                  <Text className="flex-1 text-base font-semibold leading-6 text-foreground-heading" numberOfLines={2}>
                    {instruction.title}
                  </Text>
                  {instruction.timer_minutes && instruction.timer_minutes > 0 && (
                    <View className="flex-row items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-1">
                      <AlarmIcon size={14} color="#334d43" weight="bold" />
                      <Text className="text-xs font-semibold text-primary">
                        {instruction.timer_minutes}m
                      </Text>
                    </View>
                  )}
                </View>

                {/* Description */}
                <Text className="text-sm leading-6 text-foreground-muted" numberOfLines={3}>
                  {instruction.description}
                </Text>
              </View>
            </Pressable>

            {/* Center: Delete Button */}
            <View className="flex-col">
              <View className="flex-1 items-center justify-center" >
                <Pressable
                  onPress={onDelete}
                  className="p-2"
                  hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
                >
                  <TrashIcon size={18} color="#c65d47" weight="bold" />
                </Pressable>
              </View>
            </View>
          </View>
        </ShadowItem>
      </View>
    </DraggableItem>
  );
}
