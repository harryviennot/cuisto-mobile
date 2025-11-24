import React, { useState, useEffect } from "react";
import { View, Text, Pressable, TextInput as RNTextInput } from "react-native";
import { PlusIcon, CheckIcon } from "phosphor-react-native";
import { ShadowItem } from "@/components/ShadowedSection";
import { useDeviceType } from "@/hooks/useDeviceType";
import type { Ingredient } from "@/types/recipe";

interface ExpandableIngredientFormProps {
    mode: "add" | "edit";
    groupName: string;
    ingredient?: Ingredient;
    isExpanded: boolean;
    onToggle: () => void;
    onSave: (ingredient: Ingredient) => void;
}

export function ExpandableIngredientForm({
    mode,
    groupName,
    ingredient,
    isExpanded,
    onToggle,
    onSave,
}: ExpandableIngredientFormProps) {
    console.log("Ingredient:", ingredient);
    const { isTablet } = useDeviceType();
    const [name, setName] = useState(ingredient?.name ?? "");
    const [quantity, setQuantity] = useState<string>(
        ingredient?.quantity != null ? String(ingredient.quantity) : ""
    );
    const [unit, setUnit] = useState(ingredient?.unit ?? "");
    const [notes, setNotes] = useState(ingredient?.notes ?? "");

    // Sync state with ingredient prop when it changes (for edit mode)
    useEffect(() => {
        if (ingredient && isExpanded) {
            setName(ingredient.name ?? "");
            setQuantity(ingredient.quantity != null ? String(ingredient.quantity) : "");
            setUnit(ingredient.unit ?? "");
            setNotes(ingredient.notes ?? "");
        }
    }, [ingredient, isExpanded]);

    const handleSave = () => {
        if (!name.trim()) return;

        const savedIngredient: Ingredient = {
            name: name.trim(),
            quantity: quantity?.trim() || undefined,
            unit: unit?.trim() || undefined,
            notes: notes?.trim() || undefined,
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

                <ShadowItem className="flex-row items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border-light bg-transparent py-3" onPress={onToggle}>
                    <PlusIcon size={20} color="#334d43" weight="bold" />
                    <Text className="text-sm font-semibold text-foreground">
                        {mode === "add" ? "Add Ingredient" : ingredient?.name || "Edit Ingredient"}
                    </Text>
                </ShadowItem>
            )}

            {/* Expanded state - form */}
            {isExpanded && (
                <ShadowItem className="rounded-xl border-primary p-4">
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
                                className="rounded-xl border border-border-button bg-white px-3 py-3 text-base text-foreground"
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
                                className="rounded-xl border border-border-button bg-white px-3 py-3 text-base text-foreground"
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
                                className="rounded-xl border border-border-button bg-white px-3 py-3 text-base text-foreground"
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
                            className="rounded-xl border border-border-button bg-white px-3 py-3 text-base text-foreground"
                            autoCapitalize="none"
                            returnKeyType="done"
                            onSubmitEditing={handleSave}
                        />
                    </View>

                    {/* Action Buttons */}
                    <View className={`flex-row ${isTablet ? "gap-3" : "gap-2"}`}>
                        <Pressable onPress={onToggle} className="flex-1">
                            <ShadowItem className="items-center rounded-xl border border-border-button bg-white py-3">
                                <Text className="text-sm font-semibold text-foreground">Cancel</Text>
                            </ShadowItem>
                        </Pressable>
                        <Pressable onPress={handleSave} className="flex-1" disabled={!name.trim()}>
                            <ShadowItem
                                variant="primary"
                                className={`flex-row items-center justify-center gap-1.5 rounded-xl py-3 ${!name.trim() ? "opacity-50" : ""
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
