import React, { useCallback, useEffect, useRef } from "react";
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
    console.log("\n💥 [handleDragEnd] Called - about to update React state");
    console.log("   Stopping auto-scroll and cleaning up...");

    stopAutoScroll();
    setIsDragging(false);

    endDrag((from, to, newData) => {
      console.log(`\n📊 [STATE UPDATE] React re-rendering with new order`);
      console.log(`   Item moved from index ${from} → ${to}`);
      console.log(`   New data length: ${newData.length}`);
      console.log(`   Calling parent onDragEnd callback...`);

      onDragEnd({ data: newData, from, to });

      console.log(`   ✨ State update complete! Item should now be at index ${to}\n`);
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
      console.log(`📐 [LAYOUT] Item ${index} measured: height=${layout.height.toFixed(2)}px, width=${layout.width.toFixed(2)}px`);
      setItemLayout(index, layout);

      // Verify it was stored by checking the map right after
      setTimeout(() => {
        const stored = itemLayouts.get(index);
        console.log(`   ✓ Item ${index} in map: ${stored ? stored.height.toFixed(2) + 'px' : 'NOT FOUND'}, total items in map: ${itemLayouts.size}`);
      }, 0);
    },
    [setItemLayout, itemLayouts]
  );

  // Helper function to calculate and animate to ghost offset
  // Called from JS thread so it has access to current itemLayouts
  const animateToGhostPosition = useCallback((fromIndex: number, toIndex: number) => {
    const layouts = itemLayoutsRef.current;
    console.log(`\n🎯 [animateToGhostPosition] Called from JS thread`);
    console.log(`   From index: ${fromIndex}, To index: ${toIndex}`);
    console.log(`   Total layouts in map: ${layouts.size}`);

    // Get the active item's actual measured height
    const activeItemLayout = layouts.get(fromIndex);
    const activeItemHeight = activeItemLayout?.height || 0;
    console.log(`   📦 Active item (index ${fromIndex}) height: ${activeItemHeight.toFixed(2)}px`);

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
      console.log(`   📏 Moving DOWN - Items between ${fromIndex + 1} and ${toIndex}:`);
      for (let i = fromIndex + 1; i <= toIndex; i++) {
        const itemHeight = layouts.get(i)?.height || 0;
        const correction = isHeader(i) ? HEADER_CORRECTION : INSTRUCTION_CORRECTION;
        const itemType = isHeader(i) ? 'header' : 'instruction';
        itemCount++;
        totalCorrection += correction * itemCount;
        console.log(`      Item ${i} (${itemType}): ${itemHeight.toFixed(2)}px - ${(correction * itemCount).toFixed(2)}px correction`);
        offset += itemHeight;
      }
      offset -= totalCorrection;
    } else {
      console.log(`   📏 Moving UP - Items between ${toIndex} and ${fromIndex - 1}:`);
      for (let i = toIndex; i < fromIndex; i++) {
        const itemHeight = layouts.get(i)?.height || 0;
        const correction = isHeader(i) ? HEADER_CORRECTION : INSTRUCTION_CORRECTION;
        const itemType = isHeader(i) ? 'header' : 'instruction';
        itemCount++;
        totalCorrection += correction * itemCount;
        console.log(`      Item ${i} (${itemType}): ${itemHeight.toFixed(2)}px - ${(correction * itemCount).toFixed(2)}px correction`);
        offset -= itemHeight;
      }
      offset += totalCorrection; // Add because we're going negative
    }

    console.log(`   📊 Summary: ${itemCount} items, raw offset: ${(fromIndex < toIndex ? offset + totalCorrection : offset - totalCorrection).toFixed(2)}px, correction: ${totalCorrection.toFixed(2)}px, final: ${offset.toFixed(2)}px`);

    // Keep sub-pixel precision - don't round
    const ghostOffset = offset;
    console.log(`   ✨ Calculated offset: ${ghostOffset.toFixed(2)}px`);
    console.log(`   🎯 Starting animation to ghost offset...`);

    // Start the animation
    gestureTranslationY.value = withSpring(ghostOffset, {
      damping: 20,
      stiffness: 200,
      mass: 0.5
    }, (finished) => {
      if (finished) {
        console.log(`   ✅ Animation completed to: ${gestureTranslationY.value}px`);
        console.log(`   🔄 Calling handleDragEnd to update state...`);
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
            console.log(`\n🟢 [DRAG START] Item ${index}`);
            console.log(`   Initial gestureTranslationY: ${gestureTranslationY.value}`);
            console.log(`   Initial scrollY: ${scrollY.value}`);

            runOnJS(startDrag)(index);
            gestureTranslationY.value = 0;
            startScrollY.value = scrollY.value;
            runOnJS(setIsDragging)(true);
            isTouchActive.value = true;

            console.log(`   After reset - gestureTranslationY: ${gestureTranslationY.value}`);
          })
          .onUpdate((event) => {
            gestureTranslationY.value = event.translationY;
            absoluteY.value = event.absoluteY;
            // Uncomment for very detailed tracking during drag:
            // console.log(`   [DRAGGING] translationY: ${event.translationY.toFixed(2)}, absoluteY: ${event.absoluteY.toFixed(2)}`);
          })
          .onEnd(() => {
            console.log(`\n🔴 [DRAG END] Item ${index}`);
            console.log(`   Current gestureTranslationY: ${gestureTranslationY.value}`);
            console.log(`   Current scrollY: ${scrollY.value}`);
            console.log(`   startScrollY: ${startScrollY.value}`);
            console.log(`   Scroll offset during drag: ${scrollY.value - startScrollY.value}`);

            isTouchActive.value = false;

            // Calculate where the ghost space is positioned
            const destIndex = destIndexSV.value;
            console.log(`   Source index: ${index}, Destination index: ${destIndex}`);

            if (destIndex !== null && destIndex !== -1 && destIndex !== index) {
              // Calculate and animate to the ghost space position on JS thread
              // This has access to the current itemLayouts Map
              runOnJS(animateToGhostPosition)(index, destIndex);
            } else {
              console.log(`   ↩️  No movement - animating back to 0`);

              // No movement or invalid destination, just end the drag
              gestureTranslationY.value = withSpring(0, {
                damping: 20,
                stiffness: 200,
                mass: 0.5
              }, (finished) => {
                if (finished) {
                  console.log(`   ✅ Return animation completed`);
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
