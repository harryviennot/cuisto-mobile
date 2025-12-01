import React from "react";
import { Pressable, Text, ActivityIndicator, PressableProps } from "react-native";
import { ArrowRight } from "phosphor-react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { cn } from "@/utils/cn";

interface AuthButtonProps extends Omit<PressableProps, "style"> {
  title: string;
  isLoading?: boolean;
  showArrow?: boolean;
  variant?: "primary" | "secondary";
  className?: string;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

/**
 * AuthButton - Premium button with press animation and arrow icon
 * Features scale animation, haptic feedback, and loading state
 */
export const AuthButton: React.FC<AuthButtonProps> = ({
  title,
  isLoading = false,
  showArrow = true,
  variant = "primary",
  disabled,
  onPress,
  className,
  ...props
}) => {
  const scale = useSharedValue(1);
  const arrowTranslate = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const arrowStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: arrowTranslate.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.97, { damping: 15, stiffness: 400 });
    arrowTranslate.value = withSpring(4, { damping: 15, stiffness: 400 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 400 });
    arrowTranslate.value = withSpring(0, { damping: 15, stiffness: 400 });
  };

  const handlePress = (e: any) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress?.(e);
  };

  const isPrimary = variant === "primary";

  return (
    <AnimatedPressable
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled || isLoading}
      style={animatedStyle}
      className={cn(
        "h-16 flex-row items-center justify-center rounded-2xl mt-4",
        isPrimary ? "bg-white" : "bg-white/10 border border-white/20",
        (disabled || isLoading) && "opacity-50",
        className
      )}
      {...props}
    >
      {isLoading ? (
        <ActivityIndicator
          color={isPrimary ? "#1c1917" : "#ffffff"}
          size="small"
        />
      ) : (
        <>
          <Text
            className={cn(
              "text-sm font-bold uppercase tracking-[0.15em]",
              isPrimary ? "text-stone-950" : "text-white"
            )}
          >
            {title}
          </Text>
          {showArrow && (
            <Animated.View style={arrowStyle} className="ml-3">
              <ArrowRight
                size={18}
                color={isPrimary ? "#1c1917" : "#ffffff"}
                weight="bold"
              />
            </Animated.View>
          )}
        </>
      )}
    </AnimatedPressable>
  );
};
