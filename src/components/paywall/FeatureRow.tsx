/**
 * Feature Row Component
 *
 * Displays a single feature with icon, title, and description.
 * Supports a "coming soon" muted style for future features.
 */
import React from "react";
import { View, Text } from "react-native";
import { IconProps } from "phosphor-react-native";

import { cn } from "@/utils/cn";

interface FeatureRowProps {
  icon: React.ComponentType<IconProps>;
  title: string;
  description: string;
  isComingSoon?: boolean;
}

export function FeatureRow({ icon: Icon, title, description, isComingSoon = false }: FeatureRowProps) {
  return (
    <View className="flex-row items-start gap-4">
      <View
        className={cn(
          "h-10 w-10 items-center justify-center rounded-full",
          isComingSoon ? "bg-stone-200" : "bg-premium-muted"
        )}
      >
        <Icon
          size={20}
          color={isComingSoon ? "#a8a29e" : "#c9a962"}
          weight="fill"
        />
      </View>
      <View className="flex-1">
        <Text
          className={cn(
            "text-base font-semibold",
            isComingSoon ? "text-stone-400" : "text-text-heading"
          )}
        >
          {title}
        </Text>
        <Text
          className={cn(
            "text-sm",
            isComingSoon ? "text-stone-400" : "text-text-body"
          )}
        >
          {description}
        </Text>
      </View>
    </View>
  );
}
