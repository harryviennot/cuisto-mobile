import React, { memo, ReactNode } from "react";
import { ScrollView } from "react-native";
import Animated, {
  useAnimatedScrollHandler,
  useSharedValue,
  SharedValue,
} from "react-native-reanimated";

interface RecipeScrollHandlerProps {
  children: (scrollY: SharedValue<number>) => ReactNode;
  onScroll?: (scrollY: number) => void;
}

export const RecipeScrollHandler = memo(function RecipeScrollHandler({
  children,
  onScroll,
}: RecipeScrollHandlerProps) {
  const scrollY = useSharedValue(0);

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
      onScroll?.(event.contentOffset.y);
    },
  });

  return (
    <>
      {children(scrollY)}
    </>
  );
});