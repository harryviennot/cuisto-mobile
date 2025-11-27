import { useSharedValue } from "react-native-reanimated";

export const useCookingAnimations = () => {
  // Animation values
  const slideAnim = useSharedValue(0); // 0 = center, -1 = left, 1 = right
  const ingredientsSheetAnim = useSharedValue(0); // 0 = closed, 1 = open
  const nextStepAnim = useSharedValue(0); // For "Up Next" rotation: 0 -> 1 (next), 0 -> -1 (prev)
  const directionAnim = useSharedValue(0); // 1 = forward, -1 = backward
  const contentOpacity = useSharedValue(1); // 1 = visible, 0 = hidden

  return {
    slideAnim,
    ingredientsSheetAnim,
    nextStepAnim,
    directionAnim,
    contentOpacity,
  };
};
