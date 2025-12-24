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
}

export function PricingCard({
  label,
  price,
  period,
  subtext,
  badge,
  isSelected,
  onSelect,
}: PricingCardProps) {
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

  return (
    <Pressable
      onPress={handlePress}
      className={cn(
        "flex-1 rounded-2xl p-4 overflow-hidden relative",
        isSelected
          ? "bg-premium-light border-2 border-premium"
          : "bg-surface-elevated border-2 border-border"
      )}
    >
      {/* Badge */}
      {badge && (
        <View className="absolute -top-0 right-3 bg-premium px-2 py-1 rounded-b-lg">
          <Text className="text-premium-foreground text-[10px] font-bold">
            {badge}
          </Text>
        </View>
      )}

      {/* Label */}
      <Text
        className={cn(
          "text-sm font-medium mb-2",
          isSelected ? "text-premium-dark" : "text-text-body"
        )}
      >
        {label}
      </Text>

      {/* Price */}
      <View className="flex-row items-baseline">
        <Text
          className={cn(
            "font-playfair-bold text-2xl",
            isSelected ? "text-premium-foreground" : "text-text-heading"
          )}
          style={{ fontFamily: "PlayfairDisplay_700Bold" }}
        >
          {price}
        </Text>
        <Text
          className={cn(
            "text-sm ml-0.5",
            isSelected ? "text-premium-dark" : "text-text-body"
          )}
        >
          {period}
        </Text>
      </View>

      {/* Subtext */}
      {subtext && (
        <Text
          className={cn(
            "text-xs mt-1",
            isSelected ? "text-premium-dark" : "text-text-muted"
          )}
        >
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
