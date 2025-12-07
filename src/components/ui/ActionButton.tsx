import React from "react";
import { Pressable, Text, ActivityIndicator, PressableProps } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { cn } from "@/utils/cn";

interface ActionButtonProps extends Omit<PressableProps, "style"> {
  title: string;
  isLoading?: boolean;
  variant?: "primary" | "secondary" | "destructive";
  size?: "default" | "small";
  className?: string;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

/**
 * ActionButton - Reusable animated button for forms and actions
 * Features scale animation, haptic feedback, and loading state
 */
export const ActionButton: React.FC<ActionButtonProps> = ({
  title,
  isLoading = false,
  variant = "primary",
  size = "default",
  disabled,
  onPress,
  className,
  ...props
}) => {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.97, { damping: 15, stiffness: 400 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 400 });
  };

  const handlePress = (e: any) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress?.(e);
  };

  const isDisabled = disabled || isLoading;

  const getVariantStyles = () => {
    if (isDisabled) {
      return "bg-surface-disabled";
    }
    switch (variant) {
      case "primary":
        return "bg-primary";
      case "secondary":
        return "bg-stone-200";
      case "destructive":
        return "bg-red-500";
      default:
        return "bg-primary";
    }
  };

  const getTextStyles = () => {
    if (isDisabled) {
      return "text-foreground-disabled";
    }
    switch (variant) {
      case "primary":
        return "text-white";
      case "secondary":
        return "text-stone-900";
      case "destructive":
        return "text-white";
      default:
        return "text-white";
    }
  };

  const getSpinnerColor = () => {
    switch (variant) {
      case "secondary":
        return "#1c1917";
      default:
        return "#ffffff";
    }
  };

  return (
    <AnimatedPressable
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={isDisabled}
      style={animatedStyle}
      className={cn(
        "w-full flex-row items-center justify-center rounded-2xl",
        size === "default" ? "h-14" : "h-12",
        getVariantStyles(),
        className
      )}
      {...props}
    >
      {isLoading ? (
        <ActivityIndicator color={getSpinnerColor()} size="small" />
      ) : (
        <Text
          className={cn(
            "font-bold uppercase tracking-widest",
            size === "default" ? "text-sm" : "text-xs",
            getTextStyles()
          )}
        >
          {title}
        </Text>
      )}
    </AnimatedPressable>
  );
};
