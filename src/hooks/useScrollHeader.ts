import { useRef, useState, useCallback } from 'react';
import { Animated, NativeScrollEvent, NativeSyntheticEvent } from 'react-native';

interface UseScrollHeaderOptions {
  headerHeight?: number;
  scrollThreshold?: number;
  animationDuration?: number;
}

interface UseScrollHeaderReturn {
  headerTranslateY: Animated.Value;
  isHeaderVisible: boolean;
  handleScroll: (event: NativeSyntheticEvent<NativeScrollEvent>) => void;
}

export function useScrollHeader({
  headerHeight = 60,
  scrollThreshold = 10,
  animationDuration = 200,
}: UseScrollHeaderOptions = {}): UseScrollHeaderReturn {
  const scrollY = useRef(0);
  const lastScrollY = useRef(0);
  const headerTranslateY = useRef(new Animated.Value(0)).current;
  const [isHeaderVisible, setIsHeaderVisible] = useState(true);

  const handleScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const currentScrollY = event.nativeEvent.contentOffset.y;
      const delta = currentScrollY - lastScrollY.current;

      // If at the top of the list, always show header
      if (currentScrollY <= 0) {
        if (!isHeaderVisible) {
          Animated.timing(headerTranslateY, {
            toValue: 0,
            duration: animationDuration,
            useNativeDriver: true,
          }).start();
          setIsHeaderVisible(true);
        }
        lastScrollY.current = currentScrollY;
        scrollY.current = currentScrollY;
        return;
      }

      // Scrolling down - hide header
      if (delta > scrollThreshold && currentScrollY > headerHeight) {
        if (isHeaderVisible) {
          Animated.timing(headerTranslateY, {
            toValue: -headerHeight,
            duration: animationDuration,
            useNativeDriver: true,
          }).start();
          setIsHeaderVisible(false);
        }
      }
      // Scrolling up - show header
      else if (delta < -scrollThreshold) {
        if (!isHeaderVisible) {
          Animated.timing(headerTranslateY, {
            toValue: 0,
            duration: animationDuration,
            useNativeDriver: true,
          }).start();
          setIsHeaderVisible(true);
        }
      }

      lastScrollY.current = currentScrollY;
      scrollY.current = currentScrollY;
    },
    [isHeaderVisible, headerTranslateY, headerHeight, scrollThreshold, animationDuration]
  );

  return {
    headerTranslateY,
    isHeaderVisible,
    handleScroll,
  };
}
