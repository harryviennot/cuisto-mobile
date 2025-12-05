/**
 * Collection Empty State
 *
 * Generic empty state component for collections.
 * Features a dashed border container with icon blob, title, message, and CTA button.
 */
import React from "react";
import { View, Text, Pressable } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import type { Icon } from "phosphor-react-native";

export interface CollectionEmptyStateProps {
  /** Icon component to display in the blob */
  icon: Icon;
  /** Color for the icon (default: #334d43) */
  iconColor?: string;
  /** Shadow color for the icon blob */
  iconShadowColor?: string;
  /** Main title text */
  title: string;
  /** Description message */
  message: string;
  /** CTA button label */
  ctaLabel: string;
  /** Optional icon for the CTA button */
  ctaIcon?: Icon;
  /** Callback when CTA button is pressed */
  onCtaPress: () => void;
}

export function CollectionEmptyState({
  icon: IconComponent,
  iconColor = "#334d43",
  iconShadowColor = "#334d43",
  title,
  message,
  ctaLabel,
  ctaIcon: CtaIconComponent,
  onCtaPress,
}: CollectionEmptyStateProps) {
  return (
    <Animated.View
      entering={FadeInDown.delay(200).duration(600)}
      className="flex-1 px-6 py-12 items-center justify-center"
    >
      {/* Empty Slot Container */}
      <View className="w-full aspect-[3/4] max-h-[420px] border-2 border-dashed border-border rounded-[32px] items-center justify-center bg-surface-texture-light/20 p-8">
        {/* Icon Blob */}
        <View
          className="w-24 h-24 rounded-full bg-surface-elevated items-center justify-center mb-8"
          style={{
            shadowColor: iconShadowColor,
            shadowOffset: { width: 0, height: 12 },
            shadowOpacity: 0.1,
            shadowRadius: 24,
            elevation: 6,
          }}
        >
          <IconComponent size={48} color={iconColor} weight="duotone" />
        </View>

        {/* Title */}
        <Text className="font-playfair-bold text-3xl text-foreground-heading text-center mb-3">
          {title}
        </Text>

        {/* Message */}
        <Text className="text-foreground-secondary text-center mb-10 leading-6 font-medium max-w-[260px] text-base">
          {message}
        </Text>

        {/* CTA Button */}
        <Pressable
          onPress={onCtaPress}
          className="flex-row items-center gap-3 bg-primary px-8 py-4 rounded-full active:opacity-90 active:scale-95 transform transition-transform"
          style={{
            shadowColor: "#334d43",
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.25,
            shadowRadius: 16,
            elevation: 8,
          }}
        >
          {CtaIconComponent && <CtaIconComponent size={20} color="#ffffff" weight="bold" />}
          <Text className="text-white font-bold text-base tracking-wide">{ctaLabel}</Text>
        </Pressable>
      </View>
    </Animated.View>
  );
}
