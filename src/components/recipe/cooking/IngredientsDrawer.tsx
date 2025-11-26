import React, { useMemo } from "react";
import { View, Text, Pressable, ScrollView, useWindowDimensions } from "react-native";
import { X, Stack, List, CheckCircle } from "phosphor-react-native";
import { useTranslation } from "react-i18next";
import { BlurView } from "expo-blur";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import * as Haptics from "expo-haptics";
import Animated, {
    SharedValue,
    useAnimatedStyle,
    interpolate,
    useDerivedValue,
    withTiming,
    Easing,
    runOnJS,
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
    controlsHeight: number;
}

export const IngredientsDrawer: React.FC<IngredientsDrawerProps> = ({
    isIngredientsOpen,
    ingredientsSheetAnim,
    viewAllIngredients,
    setViewAllIngredients,
    visibleIngredients,
    hasRelevantIngredients,
    onToggle,
    controlsHeight,
}) => {
    const { t } = useTranslation();
    const { height } = useWindowDimensions();

    // Calculate dynamic drawer height based on ingredient count
    const drawerHeight = useMemo(() => {
        if (!visibleIngredients || Object.keys(visibleIngredients).length === 0) {
            return height * 0.45; // Larger height for empty state to center content
        }

        const ingredientCount = Object.values(visibleIngredients).reduce(
            (total, group) => total + (group?.length || 0),
            0
        );

        // Base height calculations
        const headerHeight = 170; // Header + tabs (slightly larger)
        const itemHeight = 68; // Item height with padding
        const groupHeaderHeight = 40; // Group headers
        const groupCount = Object.keys(visibleIngredients).length;
        const padding = 80;

        const contentHeight =
            headerHeight +
            (ingredientCount * itemHeight) +
            (groupCount * groupHeaderHeight) +
            padding;

        // Available space = screen height - controls height - margin
        const availableSpace = height - controlsHeight - 20;

        // Min 45%, max 80% of available space (increased for bigger modal)
        const minHeight = availableSpace * 0.45;
        const maxHeight = availableSpace * 0.8;

        return Math.min(Math.max(contentHeight, minHeight), maxHeight);
    }, [visibleIngredients, height, controlsHeight]);

    // Backdrop animations
    const backdropOpacity = useDerivedValue(() => {
        return interpolate(ingredientsSheetAnim.value, [0, 1], [0, 0.6]);
    });

    const backdropStyle = useAnimatedStyle(() => {
        return {
            opacity: backdropOpacity.value,
            pointerEvents: ingredientsSheetAnim.value > 0 ? 'auto' : 'none',
        };
    });

    // Drawer animations with smooth ease-out curve
    const sheetTranslateY = useDerivedValue(() => {
        return interpolate(
            ingredientsSheetAnim.value,
            [0, 1],
            [drawerHeight + 20, 0]
        );
    });

    const sheetOpacity = useDerivedValue(() => {
        return interpolate(ingredientsSheetAnim.value, [0, 1], [0, 1]);
    });

    const drawerStyle = useAnimatedStyle(() => {
        return {
            transform: [{ translateY: sheetTranslateY.value }],
            opacity: sheetOpacity.value,
        };
    });

    // Swipe down to dismiss gesture
    const panGesture = Gesture.Pan()
        .onUpdate((event) => {
            if (event.translationY > 0) {
                const progress = Math.max(0, 1 - event.translationY / 200);
                ingredientsSheetAnim.value = progress;
            }
        })
        .onEnd((event) => {
            if (event.translationY > 50) {
                ingredientsSheetAnim.value = withTiming(
                    0,
                    { duration: 250, easing: Easing.out(Easing.cubic) },
                    () => {
                        runOnJS(onToggle)();
                    }
                );
            } else {
                ingredientsSheetAnim.value = withTiming(1, {
                    duration: 250,
                    easing: Easing.out(Easing.cubic),
                });
            }
        });

    const handleBackdropPress = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onToggle();
    };

    const handleTabPress = (viewAll: boolean) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setViewAllIngredients(viewAll);
    };

    if (!isIngredientsOpen) return null;

    return (
        <>
            {/* Backdrop with blur */}
            <Animated.View
                style={[
                    {
                        position: "absolute",
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: controlsHeight,
                        zIndex: 45,
                    },
                    backdropStyle,
                ]}
            >
                <Pressable
                    onPress={handleBackdropPress}
                    style={{ flex: 1 }}
                >
                    <BlurView intensity={30} tint="dark" style={{ flex: 1 }}>
                        <View style={{ flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.6)' }} />
                    </BlurView>
                </Pressable>
            </Animated.View>

            {/* Drawer */}
            <GestureDetector gesture={panGesture}>
                <Animated.View
                    style={[
                        {
                            position: "absolute",
                            bottom: controlsHeight,
                            left: 0,
                            right: 0,
                            height: drawerHeight,
                            zIndex: 46,
                        },
                        drawerStyle,
                    ]}
                >
                    <BlurView
                        intensity={100}
                        tint="dark"
                        style={{
                            flex: 1,
                            borderTopLeftRadius: 24,
                            borderTopRightRadius: 24,
                            overflow: "hidden",
                        }}
                    >
                        <View
                            style={{
                                flex: 1,
                                backgroundColor: "rgba(28, 25, 23, 0.95)", // stone-900/95
                                borderTopLeftRadius: 24,
                                borderTopRightRadius: 24,
                                borderTopWidth: 1,
                                borderLeftWidth: 0,
                                borderRightWidth: 0,
                                borderColor: "rgba(255, 255, 255, 0.1)",
                                shadowColor: "#000",
                                shadowOffset: { width: 0, height: -10 },
                                shadowOpacity: 0.5,
                                shadowRadius: 40,
                            }}
                        >
                            {/* Header - higher z-index */}
                            <View
                                className="px-6 py-6"
                                style={{
                                    zIndex: 10,
                                    backgroundColor: "rgba(28, 25, 23, 0.95)"
                                }}
                            >
                                <View className="flex-row items-center justify-between">
                                    <View className="flex-1">
                                        <Text className="font-playfair-bold text-3xl tracking-tight" style={{ color: "#f5f5f4" }}>
                                            {t("recipe.ingredients")}
                                        </Text>
                                        <Text
                                            className="mt-1.5 text-[10px] font-bold uppercase tracking-widest"
                                            style={{ color: "rgba(168, 162, 158, 0.6)" }}
                                        >
                                            {viewAllIngredients
                                                ? t("recipe.cookingMode.allItems").toUpperCase()
                                                : "REQUIRED FOR THIS STEP"
                                            }
                                        </Text>
                                    </View>
                                    <Pressable
                                        onPress={onToggle}
                                        className="active:scale-90"
                                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                                    >
                                        <X size={24} color="#a8a29e" weight="bold" />
                                    </Pressable>
                                </View>
                            </View>

                            {/* Tabs - higher z-index so content scrolls underneath */}
                            <View
                                className="px-6 pb-4"
                                style={{
                                    zIndex: 10,
                                    backgroundColor: "rgba(28, 25, 23, 0.95)",
                                    paddingTop: 0
                                }}
                            >
                                <View
                                    className="flex-row gap-1 rounded-xl p-1 shadow-inner"
                                    style={{
                                        backgroundColor: "rgba(0, 0, 0, 0.2)",
                                        borderWidth: 1,
                                        borderColor: "rgba(255, 255, 255, 0.05)"
                                    }}
                                >
                                    <Pressable
                                        onPress={() => handleTabPress(false)}
                                        className="flex-1 flex-row items-center justify-center gap-2 rounded-lg py-2.5"
                                        style={{
                                            backgroundColor: !viewAllIngredients
                                                ? "rgba(16, 185, 129, 1)" // emerald-600
                                                : "transparent",
                                        }}
                                    >
                                        <Stack
                                            size={14}
                                            weight="bold"
                                            color={!viewAllIngredients ? "#ffffff" : "#78716c"}
                                        />
                                        <Text
                                            className="text-[10px] font-bold uppercase tracking-widest"
                                            style={{
                                                color: !viewAllIngredients ? "#ffffff" : "#78716c"
                                            }}
                                        >
                                            {t("recipe.cookingMode.thisStep")}
                                        </Text>
                                    </Pressable>
                                    <Pressable
                                        onPress={() => handleTabPress(true)}
                                        className="flex-1 flex-row items-center justify-center gap-2 rounded-lg py-2.5"
                                        style={{
                                            backgroundColor: viewAllIngredients
                                                ? "rgba(16, 185, 129, 1)" // emerald-600
                                                : "transparent",
                                        }}
                                    >
                                        <List
                                            size={14}
                                            weight="bold"
                                            color={viewAllIngredients ? "#ffffff" : "#78716c"}
                                        />
                                        <Text
                                            className="text-[10px] font-bold uppercase tracking-widest"
                                            style={{
                                                color: viewAllIngredients ? "#ffffff" : "#78716c"
                                            }}
                                        >
                                            {t("recipe.cookingMode.allItems")}
                                        </Text>
                                    </Pressable>
                                </View>
                            </View>

                            {/* Content */}
                            {!viewAllIngredients && !hasRelevantIngredients ? (
                                // Empty state - not scrollable, centered
                                <View className="flex-1 items-center justify-center px-6">
                                    <View
                                        className="mb-4 h-12 w-12 items-center justify-center rounded-full"
                                        style={{ backgroundColor: "rgba(255, 255, 255, 0.05)" }}
                                    >
                                        <Stack size={20} color="#78716c" />
                                    </View>
                                    <Text className="mb-1 text-center text-sm font-medium" style={{ color: "#a8a29e" }}>
                                        No ingredients needed
                                    </Text>
                                    <Text className="text-center text-sm font-medium" style={{ color: "#a8a29e" }}>
                                        for this specific step.
                                    </Text>
                                    <Pressable
                                        onPress={() => handleTabPress(true)}
                                        className="mt-4 active:scale-95"
                                    >
                                        <Text
                                            className="border-b pb-1 text-xs font-bold uppercase tracking-widest"
                                            style={{
                                                color: "#34d399",
                                                borderBottomColor: "rgba(52, 211, 153, 0.3)"
                                            }}
                                        >
                                            {t("recipe.cookingMode.viewFullList")}
                                        </Text>
                                    </Pressable>
                                </View>
                            ) : (
                                // Scrollable content - scrolls underneath tabs
                                <ScrollView
                                    className="flex-1"
                                    style={{
                                        zIndex: 1,
                                        marginTop: -16, // Overlap with tabs section
                                    }}
                                    contentContainerStyle={{
                                        paddingTop: 24, // Space at top so content starts below tabs
                                        paddingBottom: 80,
                                        paddingHorizontal: 24,
                                    }}
                                    showsVerticalScrollIndicator={false}
                                    stickyHeaderIndices={
                                        Object.entries(visibleIngredients)
                                            .map(([groupName], index) =>
                                                groupName !== "Main" && groupName !== "Pantry" ? index : -1
                                            )
                                            .filter(index => index !== -1)
                                    }
                                >
                                    {Object.entries(visibleIngredients).map(([groupName, ingredients], groupIndex) => {
                                        if (!Array.isArray(ingredients)) return null;

                                        return (
                                            <View key={groupName}>
                                                {groupName !== "Main" && groupName !== "Pantry" && (
                                                    <View
                                                        className="mb-3 -mx-6 px-6 py-3"
                                                        style={{
                                                            backgroundColor: "rgba(28, 25, 23, 0.98)",
                                                            borderBottomWidth: 1,
                                                            borderBottomColor: "rgba(255, 255, 255, 0.05)",
                                                            zIndex: 5
                                                        }}
                                                    >
                                                        <Text
                                                            className="text-[10px] font-bold uppercase"
                                                            style={{
                                                                color: "#10b981",
                                                                letterSpacing: 3.2
                                                            }}
                                                        >
                                                            {groupName}
                                                        </Text>
                                                    </View>
                                                )}
                                                <View className="gap-2" style={{ marginBottom: groupIndex < Object.keys(visibleIngredients).length - 1 ? 24 : 0 }}>
                                                    {ingredients.map((ing, idx) => {
                                                        if (!ing) return null;

                                                        return (
                                                            <View
                                                                key={`${groupName}-${idx}`}
                                                                className="flex-row items-start gap-4 rounded-xl border p-3"
                                                                style={{
                                                                    backgroundColor: "rgba(255, 255, 255, 0.05)",
                                                                    borderColor: "transparent",
                                                                }}
                                                            >
                                                                <View className="mt-0.5">
                                                                    {ing.isRelevant ? (
                                                                        <CheckCircle
                                                                            size={18}
                                                                            color="#34d399"
                                                                            weight="fill"
                                                                        />
                                                                    ) : (
                                                                        <View
                                                                            style={{
                                                                                width: 18,
                                                                                height: 18,
                                                                                borderRadius: 9,
                                                                                borderWidth: 2,
                                                                                borderColor: "#57534e"
                                                                            }}
                                                                        />
                                                                    )}
                                                                </View>
                                                                <View className="flex-1">
                                                                    <View className="flex-row items-baseline justify-between gap-4">
                                                                        <Text
                                                                            className="flex-1 font-medium leading-snug"
                                                                            style={{
                                                                                color: ing.isRelevant ? "#f5f5f4" : "#a8a29e",
                                                                            }}
                                                                        >
                                                                            {ing.name}
                                                                        </Text>
                                                                        <Text
                                                                            className="text-sm font-bold"
                                                                            style={{
                                                                                color: ing.isRelevant ? "#6ee7b7" : "#57534e",
                                                                                fontVariant: ["tabular-nums"]
                                                                            }}
                                                                        >
                                                                            {ing.quantity} {ing.unit}
                                                                        </Text>
                                                                    </View>
                                                                </View>
                                                            </View>
                                                        );
                                                    })}
                                                </View>
                                            </View>
                                        );
                                    })}
                                </ScrollView>
                            )}

                            {/* Bottom Gradient Fade - only show when scrollable */}
                            {(viewAllIngredients || hasRelevantIngredients) && (
                                <View
                                    pointerEvents="none"
                                    style={{
                                        position: 'absolute',
                                        bottom: 0,
                                        left: 0,
                                        right: 0,
                                        height: 80,
                                        borderBottomLeftRadius: 24,
                                        borderBottomRightRadius: 24,
                                    }}
                                >
                                    <View style={{ flex: 1, backgroundColor: "rgba(28, 25, 23, 0)" }} />
                                    <View style={{ flex: 1, backgroundColor: "rgba(28, 25, 23, 0.3)" }} />
                                    <View style={{ flex: 1, backgroundColor: "rgba(28, 25, 23, 0.6)" }} />
                                    <View style={{ flex: 1, backgroundColor: "rgba(28, 25, 23, 0.9)" }} />
                                    <View style={{ flex: 1, backgroundColor: "rgba(28, 25, 23, 1)" }} />
                                </View>
                            )}
                        </View>
                    </BlurView>
                </Animated.View>
            </GestureDetector>
        </>
    );
};
