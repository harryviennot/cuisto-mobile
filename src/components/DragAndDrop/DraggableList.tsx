import React, { useCallback, useEffect, useRef } from "react";
import { View, StyleSheet } from "react-native";
import {
  useSharedValue,
  withSpring,
  useAnimatedReaction,
  runOnJS,
  useDerivedValue,
} from "react-native-reanimated";
import { Gesture } from "react-native-gesture-handler";
import { useDragAndDrop } from "./useDragAndDrop";
import { useAutoScroll } from "./useAutoScroll";
import { DraggableListProps } from "./types";
import { useDragContext } from "./DragContext";


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

  // Create a ref that the worklet can access to get current layouts
  const itemLayoutsRef = useRef(itemLayouts);

  // Keep ref in sync with itemLayouts
  useEffect(() => {
    itemLayoutsRef.current = itemLayouts;
  }, [itemLayouts]);

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
    stopAutoScroll();
    setIsDragging(false);

    endDrag((from, to, newData) => {
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

  // Helper function to calculate and animate to ghost offset
  // Called from JS thread so it has access to current itemLayouts
  const animateToGhostPosition = useCallback((fromIndex: number, toIndex: number) => {
    const layouts = itemLayoutsRef.current;

    // Get the active item's actual measured height
    const activeItemLayout = layouts.get(fromIndex);
    const activeItemHeight = activeItemLayout?.height || 0;

    // Note: Layout measurements do NOT include margins
    // We need to apply a small correction factor per item to account for
    // spacing/overlap between the ghost space and final position
    // Instructions use 0.75px correction, headers may need different
    const INSTRUCTION_CORRECTION = 0.75;
    const HEADER_CORRECTION = 2.0; // Headers have more spacing (mt-2)

    // Helper to determine if an item is a header by checking its height
    const isHeader = (index: number) => {
      const height = layouts.get(index)?.height || 0;
      return height < 50; // Headers are ~34px, instructions are ~132px
    };

    let offset = 0;
    let itemCount = 0;
    let totalCorrection = 0;

    if (fromIndex < toIndex) {
      for (let i = fromIndex + 1; i <= toIndex; i++) {
        const itemHeight = layouts.get(i)?.height || 0;
        const correction = isHeader(i) ? HEADER_CORRECTION : INSTRUCTION_CORRECTION;
        itemCount++;
        totalCorrection += correction * itemCount;
        offset += itemHeight;
      }
      offset -= totalCorrection;
    } else {
      for (let i = toIndex; i < fromIndex; i++) {
        const itemHeight = layouts.get(i)?.height || 0;
        const correction = isHeader(i) ? HEADER_CORRECTION : INSTRUCTION_CORRECTION;
        itemCount++;
        totalCorrection += correction * itemCount;
        offset -= itemHeight;
      }
      offset += totalCorrection; // Add because we're going negative
    }

    // Keep sub-pixel precision - don't round
    const ghostOffset = offset;

    // Start the animation
    gestureTranslationY.value = withSpring(ghostOffset, {
      damping: 20,
      stiffness: 200,
      mass: 0.5
    }, (finished) => {
      if (finished) {
        runOnJS(handleDragEnd)();
      }
    });
  }, [gestureTranslationY, handleDragEnd]);

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

            if (destIndex !== null && destIndex !== -1 && destIndex !== index) {
              // Calculate and animate to the ghost space position on JS thread
              // This has access to the current itemLayouts Map
              runOnJS(animateToGhostPosition)(index, destIndex);
            } else {
              // No movement or invalid destination, just end the drag
              gestureTranslationY.value = withSpring(0, {
                damping: 45,
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
