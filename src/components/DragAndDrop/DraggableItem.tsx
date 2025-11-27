import React, { useEffect } from "react";
import { StyleSheet, View, LayoutRectangle } from "react-native";
import Animated, {
  useAnimatedStyle,
  withSpring,
  withTiming,
  useSharedValue,
  SharedValue,
  LinearTransition,
} from "react-native-reanimated";

interface DraggableItemProps {
  children: React.ReactNode;
  isActive: boolean;
  index: number;
  activeIndex: number | null;
  destIndex: number | null;
  itemHeight: number;
  dragTranslationY: SharedValue<number>;
  onLayout?: (event: any) => void;
  itemLayouts?: Map<number, LayoutRectangle>;
}

export function DraggableItem({
  children,
  isActive,
  index,
  activeIndex,
  destIndex,
  itemHeight,
  dragTranslationY,
  onLayout,
  itemLayouts,
}: DraggableItemProps) {
  const scaleAnim = useSharedValue(1);
  const opacityAnim = useSharedValue(1);
  const shiftY = useSharedValue(0);

  // Animate when active state changes
  useEffect(() => {
    if (isActive) {
      scaleAnim.value = withSpring(1.05);
      opacityAnim.value = withTiming(0.9, { duration: 150 });
    } else {
      scaleAnim.value = withSpring(1);
      opacityAnim.value = withTiming(1, { duration: 150 });
    }
  }, [isActive, scaleAnim, opacityAnim]);

  // Calculate visual shift based on drag position
  useEffect(() => {
    if (isActive) {
      shiftY.value = 0; // Active item doesn't shift, it's being dragged
      return;
    }

    if (activeIndex === null || destIndex === null) {
      shiftY.value = withSpring(0);
      return;
    }

    // Logic to shift items out of the way
    let targetShift = 0;

    if (activeIndex < destIndex) {
      // Dragging down: items between active and dest shift UP by the active item's height
      if (index > activeIndex && index <= destIndex) {
        // Use the actual height of the active item from layouts
        const activeHeight = itemLayouts?.get(activeIndex)?.height ?? itemHeight;
        targetShift = -activeHeight;
      }
    } else if (activeIndex > destIndex) {
      // Dragging up: items between dest and active shift DOWN by the active item's height
      if (index >= destIndex && index < activeIndex) {
        // Use the actual height of the active item from layouts
        const activeHeight = itemLayouts?.get(activeIndex)?.height ?? itemHeight;
        targetShift = activeHeight;
      }
    }

    // Tighter spring config for less "bouncy" feel
    shiftY.value = withSpring(targetShift, { damping: 40, stiffness: 300 });
  }, [activeIndex, destIndex, index, isActive, itemHeight, itemLayouts, shiftY]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { scale: scaleAnim.value },
        { translateY: isActive ? dragTranslationY.value : shiftY.value },
      ],
      opacity: opacityAnim.value,
      // Ensure active item is always on top
      zIndex: isActive ? 9999 : 1,
    };
  });

  return (
    <View
      style={[styles.container, { zIndex: isActive ? 9999 : 1 }]}
      collapsable={false}
      onLayout={onLayout}
    >
      <Animated.View
        style={[styles.itemContainer, animatedStyle]}
        layout={LinearTransition.springify().damping(45).stiffness(200)}
      >
        {children}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
  },
  itemContainer: {
    width: "100%",
  },
});
