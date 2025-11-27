import { useRef, useCallback } from "react";
import { ScrollView, Dimensions } from "react-native";

interface UseAutoScrollProps {
  scrollViewRef: React.RefObject<ScrollView | null>;
  threshold?: number;
  speed?: number;
}

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

export function useAutoScroll({
  scrollViewRef,
  threshold = 100, // Increased threshold for better UX
  speed = 15,
}: UseAutoScrollProps) {
  const scrollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const currentScrollOffsetRef = useRef(0);

  // We track the scroll direction to prevent fighting against the user
  const autoScrollDirection = useRef<"up" | "down" | null>(null);

  const stopAutoScroll = useCallback(() => {
    if (scrollIntervalRef.current) {
      clearInterval(scrollIntervalRef.current);
      scrollIntervalRef.current = null;
      autoScrollDirection.current = null;
    }
  }, []);

  const startAutoScroll = useCallback(
    (absoluteY: number) => {
      if (!scrollViewRef?.current) return;

      // Define active zones
      const topZone = threshold;
      const bottomZone = SCREEN_HEIGHT - threshold;

      // Check if inside top zone
      if (absoluteY < topZone) {
        if (autoScrollDirection.current === "up") return; // Already scrolling up

        stopAutoScroll();
        autoScrollDirection.current = "up";

        scrollIntervalRef.current = setInterval(() => {
          // Calculate speed based on how close to edge (closer = faster)
          const intensity = Math.max(0, (topZone - absoluteY) / topZone);
          const scrollAmount = Math.max(2, speed * intensity);

          const newOffset = Math.max(0, currentScrollOffsetRef.current - scrollAmount);

          if (newOffset !== currentScrollOffsetRef.current) {
            scrollViewRef.current?.scrollTo({ y: newOffset, animated: false });
            currentScrollOffsetRef.current = newOffset;
          }
        }, 16);
      }
      // Check if inside bottom zone
      else if (absoluteY > bottomZone) {
        if (autoScrollDirection.current === "down") return; // Already scrolling down

        stopAutoScroll();
        autoScrollDirection.current = "down";

        scrollIntervalRef.current = setInterval(() => {
          // Calculate speed based on how close to edge
          const intensity = Math.max(0, (absoluteY - bottomZone) / threshold);
          const scrollAmount = Math.max(2, speed * intensity);

          // We don't know max scroll height easily without layout measurement,
          // so we just scroll down. ScrollView handles bounds.
          const newOffset = currentScrollOffsetRef.current + scrollAmount;

          scrollViewRef.current?.scrollTo({ y: newOffset, animated: false });
          currentScrollOffsetRef.current = newOffset;
        }, 16);
      } else {
        // In the middle safe zone
        stopAutoScroll();
      }
    },
    [scrollViewRef, threshold, speed, stopAutoScroll]
  );

  const updateScrollOffset = useCallback((offset: number) => {
    currentScrollOffsetRef.current = offset;
  }, []);

  return {
    startAutoScroll,
    stopAutoScroll,
    updateScrollOffset,
  };
}
