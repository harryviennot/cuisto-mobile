/**
 * Pricing Card Component
 *
 * Selectable pricing option with gold scintillation effect when selected.
 * Based on PremiumPlanCard animation pattern.
 */
import React, { useEffect } from "react";
import { View, Text, Pressable } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withRepeat,
  withSequence,
  Easing,
  interpolate,
  cancelAnimation,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";

import { cn } from "@/utils/cn";

interface PricingCardProps {
  label: string;
  price: string;
  period: string;
  subtext?: string;
  badge?: string;
  isSelected: boolean;
  onSelect: () => void;
  variant?: "default" | "gold";
}

export function PricingCard({
  label,
  price,
  period,
  subtext,
  badge,
  isSelected,
  onSelect,
  variant = "default",
}: PricingCardProps) {
  const isGold = variant === "gold";
  // Scintillation animation - only runs when selected
  const scintPosition = useSharedValue(-1);

  useEffect(() => {
    if (isSelected) {
      // Animate: quick sweep (800ms) then pause (3000ms) cycle
      scintPosition.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 800, easing: Easing.inOut(Easing.ease) }),
          withDelay(3000, withTiming(-1, { duration: 0 }))
        ),
        -1,
        false
      );
    } else {
      cancelAnimation(scintPosition);
      scintPosition.value = -1;
    }

    return () => {
      cancelAnimation(scintPosition);
    };
  }, [isSelected, scintPosition]);

  const scintStyle = useAnimatedStyle(() => {
    const translateX = interpolate(scintPosition.value, [-1, 1], [-100, 200]);

    return {
      transform: [{ translateX }, { skewX: "-20deg" }],
      opacity: isSelected ? 1 : 0,
    };
  });

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onSelect();
  };

  // When gold variant is selected, use gold background with white text
  const isGoldSelected = isGold && isSelected;

  return (
    <Pressable
      onPress={handlePress}
      className={cn(
        "flex-1 rounded-2xl p-4 overflow-hidden relative",
        isGoldSelected
          ? "bg-premium border-2 border-premium"
          : isSelected
            ? "bg-surface-elevated border-2 border-primary"
            : "bg-surface-elevated border-2 border-border"
      )}
    >
      {/* Badge */}
      {badge && (
        <View
          className={cn(
            "absolute -top-0 right-3 px-2 py-1 rounded-b-lg",
            isGoldSelected ? "bg-white/20" : isGold ? "bg-premium" : "bg-primary"
          )}
        >
          <Text
            className={cn("text-[10px] font-bold", isGoldSelected ? "text-white" : "text-white")}
          >
            {badge}
          </Text>
        </View>
      )}

      {/* Label */}
      <Text
        className={cn(
          "text-sm font-medium mb-2",
          isGoldSelected
            ? "text-white/90"
            : isSelected
              ? isGold
                ? "text-premium"
                : "text-primary"
              : "text-text-body"
        )}
      >
        {label}
      </Text>

      {/* Price */}
      <View className="flex-row items-baseline">
        <Text
          className={cn("text-2xl font-bold", isGoldSelected ? "text-white" : "text-text-heading")}
        >
          {price}
        </Text>
        <Text className={cn("text-sm ml-0.5", isGoldSelected ? "text-white/80" : "text-text-body")}>
          {period}
        </Text>
      </View>

      {/* Subtext */}
      {subtext && (
        <Text className={cn("text-xs mt-1", isGoldSelected ? "text-white/70" : "text-text-muted")}>
          {subtext}
        </Text>
      )}

      {/* Gold scintillation overlay */}
      <Animated.View
        style={[
          {
            position: "absolute",
            top: 0,
            bottom: 0,
            width: 60,
          },
          scintStyle,
        ]}
        pointerEvents="none"
      >
        <LinearGradient
          colors={[
            "transparent",
            "rgba(255, 255, 255, 0.2)",
            "rgba(255, 255, 255, 0.5)",
            "rgba(255, 255, 255, 0.2)",
            "transparent",
          ]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={{ width: 60, height: "100%" }}
        />
      </Animated.View>
    </Pressable>
  );
}
