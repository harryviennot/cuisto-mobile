import { ReactNode } from "react";
import { View, useWindowDimensions } from "react-native";
import Animated, {
  useAnimatedStyle,
  interpolate,
  Extrapolation,
  SharedValue,
} from "react-native-reanimated";

interface OnboardingCardProps {
  stepIndex: number;
  animatedStep: SharedValue<number>;
  children: ReactNode;
}

export function OnboardingCard({ stepIndex, animatedStep, children }: OnboardingCardProps) {
  const { width } = useWindowDimensions();

  const animatedStyle = useAnimatedStyle(() => {
    // Position relative to current step: negative = left, 0 = center, positive = right
    const position = stepIndex - animatedStep.value;

    const translateX = interpolate(position, [-1, 0, 1], [-width, 0, width], Extrapolation.CLAMP);

    const scale = interpolate(position, [-1, 0, 1], [0.9, 1, 0.9], Extrapolation.CLAMP);

    const opacity = interpolate(position, [-1, 0, 1], [0, 1, 0], Extrapolation.CLAMP);

    return {
      transform: [{ translateX }, { scale }],
      opacity,
    };
  });

  // Only allow touches on the current card
  const isCurrentStep = Math.round(animatedStep.value) === stepIndex;

  return (
    <Animated.View
      className="absolute inset-0 items-center justify-center px-5"
      style={animatedStyle}
      pointerEvents={isCurrentStep ? "auto" : "none"}
    >
      <View className="w-full max-w-[500px] overflow-hidden rounded-[32px] bg-[#FDFBF7] shadow-2xl">
        {children}
      </View>
    </Animated.View>
  );
}
