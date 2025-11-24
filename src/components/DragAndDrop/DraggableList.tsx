import React, { useCallback, useEffect } from "react";
import { View, StyleSheet } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  useAnimatedReaction,
  SharedValue,
  runOnJS,
  useDerivedValue,
} from "react-native-reanimated";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import { useDragAndDrop } from "./useDragAndDrop";
import { useAutoScroll } from "./useAutoScroll";
import { DraggableListProps } from "./types";
import { useDragContext } from "./DragContext";

// Helper to calculate where the ghost space is positioned
// This is where items have shifted to create space for the dragged item
function calculateGhostSpaceOffset(
  fromIndex: number,
  toIndex: number,
  layouts: Map<number, any>
): number {
  'worklet';
  if (fromIndex === toIndex) return 0;

  // The ghost space is created by items shifting
  // We need to calculate the cumulative Y offset of those shifts
  let offset = 0;
  const activeItemHeight = layouts.get(fromIndex)?.height || 0;

  if (fromIndex < toIndex) {
    // Moving down: items between fromIndex and toIndex shifted UP
    // The ghost space is below us, so we need to move DOWN
    // by the sum of heights of items that shifted
    for (let i = fromIndex + 1; i <= toIndex; i++) {
      const itemHeight = layouts.get(i)?.height || 0;
      offset += itemHeight;
    }
  } else {
    // Moving up: items between toIndex and fromIndex shifted DOWN
    // The ghost space is above us, so we need to move UP (negative)
    // by the sum of heights of items that shifted
    for (let i = toIndex; i < fromIndex; i++) {
      const itemHeight = layouts.get(i)?.height || 0;
      offset -= itemHeight;
    }
  }

  return offset;
}

export function DraggableList<T>({
  data,
  renderItem,
  keyExtractor,
  onDragEnd,
  activationDelay = 500,
  autoscrollThreshold = 50,
  autoscrollSpeed = 10,
}: DraggableListProps<T>) {
  const { setIsDragging, rootScrollViewRef, scrollY } = useDragContext();

  const {
    dragState,
    currentDestIndex,
    orderedData,
    activeItemHeight,
    itemLayouts,
    startDrag,
    updateDragPosition,
    endDrag,
    setItemLayout,
  } = useDragAndDrop<T>(data);

  const { startAutoScroll, stopAutoScroll } = useAutoScroll({
    scrollViewRef: rootScrollViewRef,
    threshold: autoscrollThreshold,
    speed: autoscrollSpeed,
  });

  const gestureTranslationY = useSharedValue(0);
  const absoluteY = useSharedValue(0);
  const isTouchActive = useSharedValue(false);
  const startScrollY = useSharedValue(0);

  // Shared value to track destination index on UI thread
  const destIndexSV = useSharedValue<number | null>(null);

  // Sync destIndexSV with currentDestIndex
  useEffect(() => {
    destIndexSV.value = currentDestIndex;
  }, [currentDestIndex, destIndexSV]);

  // Calculate total translation including scroll offset compensation
  // This ensures the item stays under the finger even when auto-scrolling
  // and the finger is held still (gesture doesn't update, but scrollY does)
  const totalTranslateY = useDerivedValue(() => {
    return gestureTranslationY.value + (scrollY.value - startScrollY.value);
  });

  // Update context when drag state changes
  useEffect(() => {
    setIsDragging(dragState.activeIndex !== null);
  }, [dragState.activeIndex, setIsDragging]);

  const handleDragEnd = useCallback(() => {
    console.log("[DraggableList] Drag ended, cleaning up");
    stopAutoScroll();
    setIsDragging(false);
    endDrag((from, to, newData) => {
      console.log("[DraggableList] Item moved from", from, "to", to);
      onDragEnd({ data: newData, from, to });
    });
  }, [endDrag, onDragEnd, stopAutoScroll, setIsDragging]);

  // Monitor drag position changes for reordering and auto-scroll
  useAnimatedReaction(
    () => ({ y: totalTranslateY.value, absY: absoluteY.value, active: isTouchActive.value }),
    (current) => {
      if (current.active) {
        runOnJS(updateDragPosition)(current.y);
        runOnJS(startAutoScroll)(current.absY);
      }
    },
    [updateDragPosition, startAutoScroll]
  );

  const handleItemLayout = useCallback(
    (index: number, event: any) => {
      const { layout } = event.nativeEvent;
      setItemLayout(index, layout);
    },
    [setItemLayout]
  );

  return (
    <View style={styles.container}>
      {orderedData.map((item, index) => {
        const key = keyExtractor(item, index);
        const isActive = dragState.activeIndex === index;

        // Create gesture for this specific item
        const panGesture = Gesture.Pan()
          .onStart(() => {
            runOnJS(startDrag)(index);
            gestureTranslationY.value = 0;
            startScrollY.value = scrollY.value;
            runOnJS(setIsDragging)(true);
            isTouchActive.value = true;
          })
          .onUpdate((event) => {
            gestureTranslationY.value = event.translationY;
            absoluteY.value = event.absoluteY;
          })
          .onEnd(() => {
            isTouchActive.value = false;

            // Calculate where the ghost space is positioned
            const destIndex = destIndexSV.value;
            if (destIndex !== null && destIndex !== -1) {
              // Calculate the Y offset to the ghost space
              const ghostOffset = calculateGhostSpaceOffset(index, destIndex, itemLayouts);

              // Animate to the ghost space position
              gestureTranslationY.value = withSpring(ghostOffset, {
                damping: 20,
                stiffness: 200,
                mass: 0.5
              }, (finished) => {
                if (finished) {
                  runOnJS(handleDragEnd)();
                }
              });
            } else {
              // No valid destination, animate back to original position
              gestureTranslationY.value = withSpring(0, {
                damping: 20,
                stiffness: 200,
                mass: 0.5
              }, (finished) => {
                if (finished) {
                  runOnJS(handleDragEnd)();
                }
              });
            }
          })
          .onTouchesUp(() => {
            isTouchActive.value = false;
            runOnJS(stopAutoScroll)();
          })
          .onFinalize(() => {
            isTouchActive.value = false;
            runOnJS(stopAutoScroll)();
          });

        return (
          <React.Fragment key={key}>
            {renderItem({
              item,
              index,
              drag: () => { }, // No-op, gesture is now attached to item
              isActive,
              // Pass internal props to the DraggableItem component
              // @ts-ignore - We are passing extra props that the renderItem might not expose directly
              internalProps: {
                index,
                activeIndex: dragState.activeIndex,
                destIndex: currentDestIndex,
                itemHeight: activeItemHeight || 60, // Fallback to 60 if not measured yet
                panGesture,
                dragTranslationY: totalTranslateY,
                onLayout: (event: any) => handleItemLayout(index, event),
                itemLayouts,
              }
            })}
          </React.Fragment>
        );
      })}
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
