import React, { memo, ReactNode } from "react";

import { useSharedValue, SharedValue } from "react-native-reanimated";

interface RecipeScrollHandlerProps {
  children: (scrollY: SharedValue<number>) => ReactNode;
  onScroll?: (scrollY: number) => void;
}

export const RecipeScrollHandler = memo(function RecipeScrollHandler({
  children,
  onScroll,
}: RecipeScrollHandlerProps) {
  const scrollY = useSharedValue(0);

  return <>{children(scrollY)}</>;
});
