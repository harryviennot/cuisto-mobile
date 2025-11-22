import React, { useRef, useEffect, useCallback } from "react";
import { ScrollView, Text, Pressable } from "react-native";
import { ShadowItem } from "../ShadowedSection";
import { useDeviceType } from "@/hooks/useDeviceType";

interface ServingsSelectorProps {
  initialServings: number;
  currentServings: number;
  onServingsChange: (servings: number) => void;
}

export const ServingsSelector: React.FC<ServingsSelectorProps> = ({
  initialServings,
  currentServings,
  onServingsChange,
}) => {
  const { width } = useDeviceType();
  const scrollViewRef = useRef<ScrollView>(null);
  const isUserScrollingRef = useRef(false);
  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Generate servings array: 1, 2, 4, 6, 8, 10, 12, ... up to 50
  const generateServings = (): number[] => {
    const servings = [1, 2];
    for (let i = 4; i <= 50; i += 2) {
      servings.push(i);
    }
    return servings;
  };

  const allServings = generateServings();
  const ITEM_WIDTH = (width - 4 * 8 - 4) / 5; // Width of each serving button
  const CONTAINER_PADDING = 4; // Padding from ShadowItem

  // Scroll to center the selected value
  const scrollToCenter = useCallback(
    (value: number) => {
      const index = allServings.indexOf(value);
      if (index === -1) return;

      // Calculate scroll position to center the item
      // We need to account for the container width
      const scrollPosition = index * ITEM_WIDTH - ITEM_WIDTH * 2;

      scrollViewRef.current?.scrollTo({
        x: scrollPosition,
        animated: true,
      });
    },
    [allServings, ITEM_WIDTH]
  );

  // Reset idle timer - call this whenever user interacts with scroll
  const resetIdleTimer = useCallback(() => {
    // Clear existing timer
    if (idleTimerRef.current) {
      clearTimeout(idleTimerRef.current);
    }

    // Set new timer to auto-center after 2 seconds of inactivity
    idleTimerRef.current = setTimeout(() => {
      scrollToCenter(currentServings);
    }, 2000);
  }, [currentServings, scrollToCenter]);

  const handlePress = (value: number) => {
    isUserScrollingRef.current = true;
    onServingsChange(value);
    scrollToCenter(value);

    // Reset flag after animation completes
    setTimeout(() => {
      isUserScrollingRef.current = false;
    }, 400);
  };

  const handleScrollBeginDrag = () => {
    // Clear idle timer when user starts scrolling
    if (idleTimerRef.current) {
      clearTimeout(idleTimerRef.current);
    }
  };

  const handleScrollEndDrag = () => {
    // Start idle timer when user stops dragging
    resetIdleTimer();
  };

  const handleMomentumScrollEnd = () => {
    // Reset timer after momentum scroll completes
    resetIdleTimer();
  };

  // Auto-scroll to current servings on mount and when it changes externally
  useEffect(() => {
    // Skip if user is manually scrolling to prevent double animation
    if (isUserScrollingRef.current) return;

    // Small delay to ensure ScrollView is rendered
    const timer = setTimeout(() => {
      scrollToCenter(currentServings);
    }, 100);

    return () => clearTimeout(timer);
  }, [currentServings, scrollToCenter]);

  // Cleanup idle timer on unmount
  useEffect(() => {
    return () => {
      if (idleTimerRef.current) {
        clearTimeout(idleTimerRef.current);
      }
    };
  }, []);

  return (
    <ShadowItem className="rounded-xl  mb-6 overflow-hidden">
      <ScrollView
        ref={scrollViewRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: CONTAINER_PADDING,
          gap: 4,
          alignItems: "center",
          padding: 4,
        }}
        decelerationRate="fast"
        snapToInterval={ITEM_WIDTH}
        snapToAlignment="center"
        onScrollBeginDrag={handleScrollBeginDrag}
        onScrollEndDrag={handleScrollEndDrag}
        onMomentumScrollEnd={handleMomentumScrollEnd}
      >
        {allServings.map((value) => {
          const isSelected = value === currentServings;

          return (
            <Pressable
              key={value}
              onPress={() => handlePress(value)}
              className={`py-3 rounded-lg items-center justify-center ${
                isSelected ? "bg-primary" : ""
              }`}
              style={{
                width: ITEM_WIDTH - 4, // Account for gap
              }}
            >
              <Text
                className={`text-sm font-medium ${
                  isSelected ? "text-white" : "text-foreground-heading"
                }`}
              >
                {value}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </ShadowItem>
  );
};
