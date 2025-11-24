import { useState, useRef, useCallback } from "react";
import { LayoutRectangle } from "react-native";
import * as Haptics from "expo-haptics";
import { DragState } from "./types";

export function useDragAndDrop<T>(data: T[]) {
  const [dragState, setDragState] = useState<DragState>({
    activeIndex: null,
    offsetY: 0,
  });

  // Track where the item would drop if released now
  const [currentDestIndex, setCurrentDestIndex] = useState<number | null>(null);

  const itemLayouts = useRef<Map<number, LayoutRectangle>>(new Map());
  const [orderedData, setOrderedData] = useState<T[]>(data);

  // Update ordered data when prop data changes
  if (data !== orderedData && dragState.activeIndex === null) {
    setOrderedData(data);
  }

  const startDrag = useCallback((index: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setDragState({
      activeIndex: index,
      offsetY: 0,
    });
    setCurrentDestIndex(index);
  }, []);

  const updateDragPosition = useCallback((offsetY: number) => {
    setDragState((prev) => {
      // Calculate new dest index based on current offset
      if (prev.activeIndex !== null) {
        const activeLayout = itemLayouts.current.get(prev.activeIndex);
        if (activeLayout) {
          // Current absolute Y of the dragged item center
          const currentY = activeLayout.y + activeLayout.height / 2 + offsetY;

          const newDestIndex = calculateDropIndex(
            currentY,
            itemLayouts.current,
            orderedData.length
          );

          if (newDestIndex !== currentDestIndex) {
            setCurrentDestIndex(newDestIndex);
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          }
        }
      }

      return {
        ...prev,
        offsetY,
      };
    });
  }, [orderedData.length, currentDestIndex]);

  const endDrag = useCallback(
    (onDragEnd: (from: number, to: number, newData: T[]) => void) => {
      if (dragState.activeIndex === null) return;

      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      const fromIndex = dragState.activeIndex;
      // Use the tracked dest index, or fallback to calculation
      let toIndex = currentDestIndex;

      if (toIndex === null) {
        const activeLayout = itemLayouts.current.get(fromIndex);
        const currentY = activeLayout ? activeLayout.y + activeLayout.height / 2 + dragState.offsetY : 0;
        toIndex = calculateDropIndex(
          currentY,
          itemLayouts.current,
          orderedData.length
        );
      }

      if (fromIndex !== toIndex) {
        const newData = reorderArray(orderedData, fromIndex, toIndex);
        setOrderedData(newData);
        onDragEnd(fromIndex, toIndex, newData);
      }

      setDragState({
        activeIndex: null,
        offsetY: 0,
      });
      setCurrentDestIndex(null);
    },
    [dragState, orderedData, currentDestIndex]
  );

  const cancelDrag = useCallback(() => {
    setDragState({
      activeIndex: null,
      offsetY: 0,
    });
    setCurrentDestIndex(null);
  }, []);

  const setItemLayout = useCallback((index: number, layout: LayoutRectangle) => {
    itemLayouts.current.set(index, layout);
  }, []);

  const activeItemHeight = dragState.activeIndex !== null
    ? itemLayouts.current.get(dragState.activeIndex)?.height || 0
    : 0;

  return {
    dragState,
    currentDestIndex,
    orderedData,
    activeItemHeight,
    startDrag,
    updateDragPosition,
    endDrag,
    cancelDrag,
    setItemLayout,
  };
}

// Helper: Calculate which index to drop the item at based on Y offset
function calculateDropIndex(
  currentY: number,
  layouts: Map<number, LayoutRectangle>,
  dataLength: number
): number {
  let closestIndex = 0;
  let closestDistance = Infinity;

  for (let i = 0; i < dataLength; i++) {
    const layout = layouts.get(i);
    if (!layout) continue;

    const itemCenterY = layout.y + layout.height / 2;
    const distance = Math.abs(currentY - itemCenterY);

    if (distance < closestDistance) {
      closestDistance = distance;
      closestIndex = i;
    }
  }

  return closestIndex;
}

// Helper: Reorder array by moving item from one index to another
function reorderArray<T>(array: T[], fromIndex: number, toIndex: number): T[] {
  const newArray = [...array];
  const [movedItem] = newArray.splice(fromIndex, 1);
  newArray.splice(toIndex, 0, movedItem);
  return newArray;
}
