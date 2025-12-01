/**
 * Onboarding option card component
 * Clean, minimal design with subtle animations
 * Supports selected/unselected states
 */
import React from "react";
import { Pressable, View, Text } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { Check } from "phosphor-react-native";
import type { Icon } from "phosphor-react-native";
import { cn } from "@/utils/cn";

interface OnboardingOptionCardProps {
  label: string;
  description?: string;
  icon: Icon;
  isSelected: boolean;
  onPress: () => void;
  disabled?: boolean;
  className?: string;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function OnboardingOptionCard({
  label,
  description,
  icon: IconComponent,
  isSelected,
  onPress,
  disabled = false,
  className,
}: OnboardingOptionCardProps) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.97, { damping: 32, stiffness: 400 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 32, stiffness: 400 });
  };

  // Derive icon props from isSelected state
  const iconColor = isSelected ? "#ffffff" : "#78716c";
  const iconWeight: "fill" | "duotone" = isSelected ? "fill" : "duotone";

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled}
      style={animatedStyle}
      hitSlop={16}
      className={cn("flex-row items-center", className)}
    >
      {/* Icon container */}
      <View
        className={cn(
          "mr-4 h-12 w-12 items-center justify-center rounded-xl",
          isSelected ? "bg-primary" : "bg-surface"
        )}
      >
        <IconComponent
          key={isSelected ? "selected" : "unselected"}
          size={24}
          weight={iconWeight}
          color={iconColor}
        />
      </View>

      {/* Text content */}
      <View className="flex-1">
        <Text className="text-base font-semibold text-foreground-heading">{label}</Text>
        {description && (
          <Text className="mt-0.5 text-sm text-foreground-muted" numberOfLines={1}>
            {description}
          </Text>
        )}
      </View>

      {/* Selection indicator */}
      <View
        className={cn(
          "ml-3 h-6 w-6 items-center justify-center rounded-full",
          isSelected ? "bg-primary" : "border-2 border-border"
        )}
      >
        {isSelected && <Check size={14} weight="bold" color="#ffffff" />}
      </View>
    </AnimatedPressable>
  );
}
