import React from "react";
import { View, Text, Pressable } from "react-native";
import { CaretUpIcon, CaretDownIcon } from "phosphor-react-native";
import { DraggableItem } from "../../DragAndDrop/DraggableItem";

interface GroupHeaderProps {
    groupName: string;
    groupIndex: number;
    totalGroups: number;
    onMoveUp: () => void;
    onMoveDown: () => void;
    internalProps?: any;
}

export function GroupHeader({
    groupName,
    groupIndex,
    totalGroups,
    onMoveUp,
    onMoveDown,
    internalProps,
}: GroupHeaderProps) {
    const isFirst = groupIndex <= 0;
    const isLast = groupIndex >= totalGroups - 1;

    const content = (
        <View className="mb-3 mt-6 flex-row items-center gap-3">
            {/* Group reorder arrows */}
            <View className="flex-row gap-1">
                <Pressable
                    hitSlop={4}
                    onPress={onMoveUp}
                    disabled={isFirst}
                    className={isFirst ? "opacity-30" : ""}
                >
                    <CaretUpIcon size={16} color="#3a3226" weight="bold" />
                </Pressable>
                <Pressable
                    hitSlop={4}
                    onPress={onMoveDown}
                    disabled={isLast}
                    className={isLast ? "opacity-30" : ""}
                >
                    <CaretDownIcon size={16} color="#3a3226" weight="bold" />
                </Pressable>
            </View>

            <Text className="font-bold shrink-0 text-sm uppercase tracking-widest text-foreground-tertiary">
                {groupName}
            </Text>
            <View className="h-px flex-1 bg-border-light" />
        </View>
    );

    // If we have internal props, wrap in DraggableItem to allow shifting
    if (internalProps) {
        return (
            <DraggableItem
                isActive={false} // Headers are never active (dragged)
                {...internalProps}
            >
                {content}
            </DraggableItem>
        );
    }

    return content;
}
