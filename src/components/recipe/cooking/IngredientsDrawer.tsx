import React from "react";
import { View, Text, Pressable, ScrollView, useWindowDimensions } from "react-native";
import { X, Stack, List } from "phosphor-react-native";
import { useTranslation } from "react-i18next";
import Animated, {
    SharedValue,
    useAnimatedStyle,
    interpolate,
    useDerivedValue,
} from "react-native-reanimated";
import type { Ingredient } from "@/types/recipe";

interface IngredientsDrawerProps {
    isIngredientsOpen: boolean;
    ingredientsSheetAnim: SharedValue<number>;
    viewAllIngredients: boolean;
    setViewAllIngredients: (viewAll: boolean) => void;
    visibleIngredients: Record<string, (Ingredient & { isRelevant: boolean })[]>;
    hasRelevantIngredients: boolean;
    onToggle: () => void;
}

export const IngredientsDrawer: React.FC<IngredientsDrawerProps> = ({
    isIngredientsOpen,
    ingredientsSheetAnim,
    viewAllIngredients,
    setViewAllIngredients,
    visibleIngredients,
    hasRelevantIngredients,
    onToggle,
}) => {
    const { t } = useTranslation();
    const { height } = useWindowDimensions();

    const sheetTranslateY = useDerivedValue(() => {
        return interpolate(
            ingredientsSheetAnim.value,
            [0, 1],
            [height * 0.4, 0]
        );
    });

    const sheetOpacity = useDerivedValue(() => {
        return interpolate(ingredientsSheetAnim.value, [0, 1], [0, 1]);
    });

    const ingredientsSheetStyle = useAnimatedStyle(() => {
        return {
            transform: [
                {
                    translateY: sheetTranslateY.value,
                },
            ],
            opacity: sheetOpacity.value,
        };
    });

    if (!isIngredientsOpen) return null;

    return (
        <Animated.View
            style={[
                {
                    position: "absolute",
                    bottom: 100,
                    left: 16,
                    right: 16,
                    maxHeight: height * 0.5,
                    backgroundColor: "rgba(255, 255, 255, 0.95)",
                    borderRadius: 24,
                    borderWidth: 1,
                    borderColor: "rgba(255, 255, 255, 0.5)",
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 10 },
                    shadowOpacity: 0.3,
                    shadowRadius: 20,
                    elevation: 10,
                    zIndex: 40,
                    overflow: "hidden",
                },
                ingredientsSheetStyle,
            ]}
        >
            <View className="border-b border-border-light bg-white/50 px-5 pb-3 pt-4 backdrop-blur-xl">
                <View className="mb-3 flex-row items-center justify-between">
                    <Text className="font-playfair text-xl text-foreground-heading">
                        {t("recipe.ingredients")}
                    </Text>
                    <Pressable
                        onPress={onToggle}
                        className="rounded-full bg-surface-texture-light p-1.5"
                    >
                        <X size={16} color="#78716c" />
                    </Pressable>
                </View>

                <View className="flex-row rounded-lg bg-surface-texture-light p-1">
                    <Pressable
                        onPress={() => setViewAllIngredients(false)}
                        className={`flex-1 flex-row items-center justify-center gap-1.5 rounded-md py-1.5 ${!viewAllIngredients ? "bg-white shadow-sm" : ""
                            }`}
                    >
                        <Stack
                            size={14}
                            color={!viewAllIngredients ? "#334d43" : "#78716c"}
                        />
                        <Text
                            className={`text-xs font-bold uppercase tracking-wide ${!viewAllIngredients ? "text-primary" : "text-foreground-muted"
                                }`}
                        >
                            {t("recipe.cookingMode.thisStep")}
                        </Text>
                    </Pressable>
                    <Pressable
                        onPress={() => setViewAllIngredients(true)}
                        className={`flex-1 flex-row items-center justify-center gap-1.5 rounded-md py-1.5 ${viewAllIngredients ? "bg-white shadow-sm" : ""
                            }`}
                    >
                        <List size={14} color={viewAllIngredients ? "#334d43" : "#78716c"} />
                        <Text
                            className={`text-xs font-bold uppercase tracking-wide ${viewAllIngredients ? "text-primary" : "text-foreground-muted"
                                }`}
                        >
                            {t("recipe.cookingMode.allItems")}
                        </Text>
                    </Pressable>
                </View>
            </View>

            <ScrollView className="px-5 py-2">
                {!viewAllIngredients && !hasRelevantIngredients ? (
                    <View className="py-8 items-center">
                        <Text className="mb-2 text-center text-foreground-muted italic">
                            {t("recipe.cookingMode.noIngredientsForStep")}
                        </Text>
                        <Pressable onPress={() => setViewAllIngredients(true)}>
                            <Text className="border-b border-primary/30 text-xs font-bold uppercase tracking-widest text-primary">
                                {t("recipe.cookingMode.viewFullList")}
                            </Text>
                        </Pressable>
                    </View>
                ) : (
                    Object.entries(visibleIngredients).map(([groupName, ingredients]) => (
                        <View key={groupName} className="mb-4">
                            {groupName !== "Main" && (
                                <Text className="mb-2 text-[10px] font-bold uppercase tracking-widest text-foreground-muted">
                                    {groupName}
                                </Text>
                            )}
                            <View className="gap-3">
                                {ingredients.map((ing, idx) => (
                                    <View
                                        key={idx}
                                        className={`flex-row justify-between ${!ing.isRelevant && !viewAllIngredients
                                            ? "opacity-50"
                                            : "opacity-100"
                                            }`}
                                    >
                                        <View className="flex-1 flex-row items-start gap-3">
                                            <View
                                                className={`mt-1.5 h-1.5 w-1.5 rounded-full ${ing.isRelevant ? "bg-primary" : "bg-border-button"
                                                    }`}
                                            />
                                            <Text
                                                className={`flex-1 font-medium leading-snug ${ing.isRelevant
                                                    ? "text-foreground-heading font-bold"
                                                    : "text-foreground-secondary"
                                                    }`}
                                            >
                                                {ing.name}
                                            </Text>
                                        </View>
                                        <Text className="text-right text-sm font-medium text-foreground-muted">
                                            {ing.quantity} {ing.unit}
                                        </Text>
                                    </View>
                                ))}
                            </View>
                        </View>
                    ))
                )}
                <View className="h-4" />
            </ScrollView>
        </Animated.View>
    );
};
