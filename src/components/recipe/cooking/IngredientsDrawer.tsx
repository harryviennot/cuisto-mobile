import React, { useMemo } from "react";
import { View, Text, Pressable, ScrollView, useWindowDimensions, SectionList } from "react-native";
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

const AnimatedSectionList = Animated.createAnimatedComponent(SectionList);

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

  // Transform visibleIngredients object into sections array for SectionList
  const sections = useMemo(() => {
    if (!visibleIngredients) return [];
    return Object.entries(visibleIngredients).map(([title, data]) => ({
      title,
      data: data || [],
    })).filter(section => section.data.length > 0);
  }, [visibleIngredients]);

  // Calculate dynamic drawer height based on ingredient count
  const targetDrawerHeight = useMemo(() => {
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

  // Animated drawer height
  const animatedDrawerHeight = useDerivedValue(() => {
    return withTiming(targetDrawerHeight, {
      duration: 300,
      easing: Easing.out(Easing.cubic),
    });
  }, [targetDrawerHeight]);

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
      [targetDrawerHeight + controlsHeight + 20, 0]
    );
  });

  const drawerStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateY: sheetTranslateY.value }],
      height: animatedDrawerHeight.value,
    };
  });

  // Tab animation
  const tabIndicatorPosition = useDerivedValue(() => {
    return withTiming(viewAllIngredients ? 1 : 0, {
      duration: 250,
      easing: Easing.out(Easing.cubic),
    });
  }, [viewAllIngredients]);

  const tabIndicatorStyle = useAnimatedStyle(() => {
    return {
      left: `${interpolate(tabIndicatorPosition.value, [0, 1], [0, 50])}%`,
    };
  });

  const activeTabTextStyle = (isActive: boolean) => useAnimatedStyle(() => {
    const activeColor = "rgba(255, 255, 255, 1)";
    const inactiveColor = "#78716c"; // stone-500

    // If this is the "All Items" tab (index 1)
    if (isActive) {
      return {
        color: withTiming(viewAllIngredients ? activeColor : inactiveColor, { duration: 200 })
      };
    } else {
      // "This Step" tab (index 0)
      return {
        color: withTiming(!viewAllIngredients ? activeColor : inactiveColor, { duration: 200 })
      };
    }
  });

  // Swipe down to dismiss gesture
  const panGesture = Gesture.Pan()
    .onUpdate((event) => {
      if (event.translationY > 0) {
        const progress = Math.max(0, 1 - event.translationY / 500);
        ingredientsSheetAnim.value = progress;
      }
    })
    .onEnd((event) => {
      if (event.translationY > 50) {
        // runOnJS(Haptics.impactAsync)(Haptics.ImpactFeedbackStyle.Light);
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

  // Removed conditional return to allow exit animation to play
  // if (!isIngredientsOpen) return null;

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
              zIndex: 46,
              overflow: 'hidden', // Ensure content doesn't spill out during height animation
            },
            drawerStyle,
          ]}
        >
          <BlurView
            intensity={95}
            tint="dark"
            style={{
              flex: 1,
              borderTopLeftRadius: 32,
              borderTopRightRadius: 32,
              overflow: "hidden",
            }}
          >
            <View
              style={{
                flex: 1,
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
                }}
              >
                <View className="flex-row items-center justify-between">
                  <View className="flex-1">
                    <Text className="font-playfair-bold text-3xl tracking-tight text-stone-50">
                      {t("recipe.ingredients")}
                    </Text>
                    <Text
                      className="mt-1.5 text-[10px] font-bold uppercase tracking-widest text-stone-400/60"
                    >
                      {viewAllIngredients
                        ? t("recipe.cookingMode.allItems").toUpperCase()
                        : t("recipe.cookingMode.requiredForThisStep").toUpperCase()
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
                  paddingTop: 0
                }}
              >
                <View
                  className="flex-row h-12 rounded-xl p-1 shadow-inner relative"
                  style={{
                    backgroundColor: "rgba(0, 0, 0, 0.2)",
                    borderWidth: 1,
                    borderColor: "rgba(255, 255, 255, 0.05)"
                  }}
                >
                  {/* Animated Background Pill */}
                  <Animated.View
                    style={[
                      {
                        position: 'absolute',
                        top: 4,
                        bottom: 4,
                        left: 4,
                        // right: 4,
                        width: '50%',
                        borderRadius: 8,
                        backgroundColor: "#10b981", // emerald-500
                        zIndex: 1,
                      },
                      tabIndicatorStyle
                    ]}
                  />

                  <Pressable
                    onPress={() => handleTabPress(false)}
                    className="flex-1 flex-row items-center justify-center gap-2 rounded-lg z-10"
                  >
                    <Stack
                      size={14}
                      weight="bold"
                      color={!viewAllIngredients ? "#ffffff" : "#78716c"}
                    />
                    <Animated.Text
                      className="text-[10px] font-bold uppercase tracking-widest"
                      style={[{ color: !viewAllIngredients ? "#ffffff" : "#78716c" }]}
                    >
                      {t("recipe.cookingMode.thisStep")}
                    </Animated.Text>
                  </Pressable>
                  <Pressable
                    onPress={() => handleTabPress(true)}
                    className="flex-1 flex-row items-center justify-center gap-2 rounded-lg z-10"
                  >
                    <List
                      size={14}
                      weight="bold"
                      color={viewAllIngredients ? "#ffffff" : "#78716c"}
                    />
                    <Animated.Text
                      className="text-[10px] font-bold uppercase tracking-widest"
                      style={[{ color: viewAllIngredients ? "#ffffff" : "#78716c" }]}
                    >
                      {t("recipe.cookingMode.allItems")}
                    </Animated.Text>
                  </Pressable>
                </View>
              </View>

              {/* Content */}
              {!viewAllIngredients && !hasRelevantIngredients ? (
                // Empty state - not scrollable, centered
                <View className="flex-1 items-center justify-center px-6 border border-red-500">
                  <View
                    className="mb-4 h-12 w-12 items-center justify-center rounded-full"
                    style={{ backgroundColor: "rgba(255, 255, 255, 0.05)" }}
                  >
                    <Stack size={20} color="#78716c" />
                  </View>
                  <Text className="text-center text-sm font-medium text-stone-400">
                    {t("recipe.cookingMode.noIngredientsForStep")}
                  </Text>

                </View>
              ) : (
                // SectionList for sticky headers
                <AnimatedSectionList
                  sections={sections}
                  keyExtractor={(item: any, index: number) => item.name + index}
                  style={{
                    flex: 1,
                    zIndex: 1,
                    marginTop: -16, // Overlap with tabs section
                  }}
                  contentContainerStyle={{
                    paddingTop: 24, // Space at top so content starts below tabs
                    paddingBottom: 80,
                    paddingHorizontal: 24,
                  }}
                  showsVerticalScrollIndicator={false}
                  stickySectionHeadersEnabled={true}
                  renderSectionHeader={({ section }: { section: any }) => {
                    if (section.title === "Main" || section.title === "Pantry") return null;
                    return (
                      <BlurView
                        intensity={80}
                        tint="dark"
                        style={{
                          marginBottom: 12,
                          marginHorizontal: -24,
                          paddingHorizontal: 24,
                          paddingVertical: 12,
                          overflow: 'hidden',
                        }}
                      >
                        <View
                          style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            backgroundColor: "rgba(28, 25, 23, 0.7)", // stone-900 with opacity
                          }}
                        />
                        <Text
                          className="text-[10px] font-bold uppercase text-emerald-500"
                          style={{
                            letterSpacing: 3.2
                          }}
                        >
                          {section.title}
                        </Text>
                        <View
                          style={{
                            position: 'absolute',
                            bottom: 0,
                            left: 0,
                            right: 0,
                            height: 1,
                            backgroundColor: "rgba(255, 255, 255, 0.05)"
                          }}
                        />
                      </BlurView>
                    );
                  }}
                  renderItem={({ item: ing }: { item: any }) => (
                    <View
                      className="flex-row items-start gap-4 rounded-xl border p-3 mb-2"
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
                  )}
                />
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
