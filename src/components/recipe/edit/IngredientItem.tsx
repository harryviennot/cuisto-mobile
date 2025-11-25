import React from "react";
import { View, Text, Pressable, type LayoutRectangle } from "react-native";
import { XIcon, DotsSixVerticalIcon } from "phosphor-react-native";
import { GestureDetector } from "react-native-gesture-handler";
import type { GestureType } from "react-native-gesture-handler";
import { DraggableItem } from "../../DragAndDrop/DraggableItem";
import { ShadowItem } from "@/components/ShadowedSection";
import type { SharedValue } from "react-native-reanimated";
import type { Ingredient } from "@/types/recipe";

interface DraggableInternalProps {
    panGesture: GestureType;
    index: number;
    activeIndex: number | null;
    destIndex: number | null;
    itemHeight: number;
    dragTranslationY: SharedValue<number>;
    onLayout?: (event: any) => void;
    itemLayouts?: Map<number, LayoutRectangle>;
}

interface IngredientItemProps {
    ingredient: Ingredient;
    isActive: boolean;
    drag: () => void;
    onEdit: () => void;
    onDelete: () => void;
    internalProps?: DraggableInternalProps;
}

export function IngredientItem({
    ingredient,
    isActive,
    drag,
    onEdit,
    onDelete,
    internalProps,
}: IngredientItemProps) {
    // If we have internal props (gesture, index, etc), use them for the draggable wrapper
    if (internalProps) {
        const { panGesture, ...draggableProps } = internalProps;

        return (
            <DraggableItem isActive={isActive} {...draggableProps}>
                <ShadowItem
                    className={`mb-2 flex-row items-center gap-3 rounded-xl p-3 pr-4 ${isActive ? "border-2 border-primary bg-primary/5" : ""
                        }`}
                >
                    {/* Drag Handle Icon - Only this part triggers drag */}
                    <GestureDetector gesture={panGesture}>
                        <DotsSixVerticalIcon size={20} color="#6b5e4c" weight="bold" />
                    </GestureDetector>

                    {/* Ingredient Display - Clickable to edit */}
                    <Pressable className="flex-1" onPress={onEdit}>
                        <Text className="text-base text-foreground">
                            {ingredient.quantity && `${ingredient.quantity} `}
                            {ingredient.unit && `${ingredient.unit} `}
                            {ingredient.name}
                            {ingredient.notes && ` (${ingredient.notes})`}
                        </Text>
                    </Pressable>

                    {/* Delete Button */}
                    <Pressable hitSlop={8} onPress={onDelete}>
                        <XIcon size={20} color="#3a3226" weight="bold" />
                    </Pressable>
                </ShadowItem>
            </DraggableItem>
        );
    }

    // Fallback for when not using the new drag system (shouldn't happen with current setup but good for safety)
    return (
        <Pressable onLongPress={drag} delayLongPress={500}>
            <ShadowItem
                className={`mb-2 flex-row items-center gap-3 rounded-xl p-3 pr-4 ${isActive ? "border-2 border-primary bg-primary/5" : ""
                    }`}
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
                <Pressable className="flex-1" onPress={onEdit}>
                    <Text className="text-base text-foreground">
                        {ingredient.quantity && `${ingredient.quantity} `}
                        {ingredient.unit && `${ingredient.unit} `}
                        {ingredient.name}
                        {ingredient.notes && ` (${ingredient.notes})`}
                    </Text>
                </Pressable>

                {/* Delete Button */}
                <Pressable hitSlop={8} onPress={onDelete}>
                    <XIcon size={20} color="#3a3226" weight="bold" />
                </Pressable>
            </ShadowItem>
        </Pressable>
    );
}
