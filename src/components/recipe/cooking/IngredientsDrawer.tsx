import React, { useMemo, useCallback, useEffect, useRef } from "react";
import { View, useWindowDimensions } from "react-native";
import { BlurView } from "expo-blur";
import * as Haptics from "expo-haptics";
import {
  SharedValue,
  useAnimatedStyle,
  interpolate,
  useDerivedValue,
  withTiming,
  Easing,
} from "react-native-reanimated";
import BottomSheet, { BottomSheetBackdrop, BottomSheetBackdropProps } from "@gorhom/bottom-sheet";
import type { Ingredient } from "@/types/recipe";
import { DrawerHeader } from "./DrawerHeader";
import { DrawerTabs } from "./DrawerTabs";
import { DrawerContent } from "./DrawerContent";

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
  const { height } = useWindowDimensions();
  const bottomSheetRef = useRef<BottomSheet>(null);

  // Calculate dynamic drawer height based on ingredient count
  const targetDrawerHeight = useMemo(() => {
    if (!visibleIngredients || Object.keys(visibleIngredients).length === 0) {
      return height * 0.6; // Larger height for empty state to center content
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
    const padding = controlsHeight;

    const contentHeight =
      headerHeight + ingredientCount * itemHeight + groupCount * groupHeaderHeight + padding;

    // Available space = screen height - controls height - margin
    const availableSpace = height - controlsHeight - 20;

    // Min 45%, max 80% of available space (increased for bigger modal)
    const minHeight = availableSpace * 0.45;
    const maxHeight = availableSpace * 0.8;

    const chosenHeight = Math.min(Math.max(contentHeight, minHeight), maxHeight);
    return chosenHeight;
  }, [visibleIngredients, height, controlsHeight]);

  // Tab animation
  const tabIndicatorPosition = useDerivedValue(() => {
    return withTiming(viewAllIngredients ? 1 : 0, {
      duration: 250,
      easing: Easing.out(Easing.cubic),
    });
  }, [viewAllIngredients]);

  const tabIndicatorStyle = useAnimatedStyle(() => {
    const leftPosition = interpolate(tabIndicatorPosition.value, [0, 1], [0, 50]);
    return {
      left: `${leftPosition}%`,
      marginLeft: 4,
    };
  });

  // Control bottom sheet based on isIngredientsOpen
  useEffect(() => {
    if (isIngredientsOpen) {
      bottomSheetRef.current?.snapToIndex(0);
    } else {
      bottomSheetRef.current?.close();
    }
  }, [isIngredientsOpen]);

  // Track if we've already triggered haptic for this gesture
  const hasTriggeredHaptic = useRef(false);

  // Handle animation start for immediate haptic feedback
  const handleAnimate = useCallback((fromIndex: number, toIndex: number) => {
    if (toIndex === -1 && fromIndex !== -1 && !hasTriggeredHaptic.current) {
      // Starting to close - immediate haptic
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      hasTriggeredHaptic.current = true;
    } else if (toIndex !== -1) {
      // Opening - reset flag
      hasTriggeredHaptic.current = false;
    }
  }, []);

  // Sync ingredientsSheetAnim with bottom sheet animation
  const handleSheetChanges = useCallback(
    (index: number) => {
      if (index === -1) {
        // Closed - only update state if currently open (prevent double toggles)
        if (isIngredientsOpen) {
          onToggle();
        }
        // Reset haptic flag
        hasTriggeredHaptic.current = false;

        ingredientsSheetAnim.value = withTiming(0, {
          duration: 250,
          easing: Easing.out(Easing.cubic),
        });
      } else {
        // Opened
        ingredientsSheetAnim.value = withTiming(1, {
          duration: 300,
          easing: Easing.out(Easing.cubic),
        });
      }
    },
    [ingredientsSheetAnim, isIngredientsOpen, onToggle]
  );

  // Handle sheet close
  const handleClose = useCallback(() => {
    if (isIngredientsOpen) {
      onToggle();
    }
    hasTriggeredHaptic.current = false;
  }, [isIngredientsOpen, onToggle]);

  const handleTabPress = useCallback(
    (viewAll: boolean) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setViewAllIngredients(viewAll);
    },
    [setViewAllIngredients]
  );

  // Custom backdrop
  const renderBackdrop = useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
        opacity={0.6}
        pressBehavior="close"
      />
    ),
    []
  );

  // Dynamic snap points based on content height
  const snapPoints = useMemo(() => [targetDrawerHeight], [targetDrawerHeight]);

  return (
    <BottomSheet
      ref={bottomSheetRef}
      index={-1}
      snapPoints={snapPoints}
      enablePanDownToClose={true}
      enableDynamicSizing={false}
      backdropComponent={renderBackdrop}
      handleComponent={null}
      animateOnMount={false}
      onAnimate={handleAnimate}
      onChange={handleSheetChanges}
      onClose={handleClose}
      backgroundStyle={{
        backgroundColor: "transparent",
      }}
      style={{
        zIndex: 46,
        marginBottom: controlsHeight,
      }}
    >
      <View style={{ height: targetDrawerHeight }}>
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
              paddingBottom: controlsHeight,
            }}
          >
            <DrawerHeader viewAllIngredients={viewAllIngredients} onToggle={onToggle} />

            <DrawerTabs
              viewAllIngredients={viewAllIngredients}
              onTabPress={handleTabPress}
              tabIndicatorStyle={tabIndicatorStyle}
            />

            <DrawerContent
              viewAllIngredients={viewAllIngredients}
              hasRelevantIngredients={hasRelevantIngredients}
              visibleIngredients={visibleIngredients}
              controlsHeight={controlsHeight}
            />
          </View>
        </BlurView>
      </View>
    </BottomSheet>
  );
};
