/**
 * Page Header
 *
 * Large scrolling header with optional subtitle and title.
 * This header scrolls with the content (not sticky).
 * Used in combination with UnifiedStickyHeader for the complete header experience.
 */
import React from "react";
import { View, Text } from "react-native";

export interface PageHeaderProps {
  /** Large title text */
  title: string;
  /** Small uppercase subtitle text (optional) */
  subtitle?: string;
  /** Top padding (usually safe area + sticky header height) */
  topPadding: number;
  /** Optional element to render on the right side of the header */
  rightElement?: React.ReactNode;
}

export function PageHeader({ title, subtitle, topPadding, rightElement }: PageHeaderProps) {
  return (
    <View
      style={{
        paddingTop: topPadding,
        paddingHorizontal: 16,
        paddingBottom: 24,
      }}
    >
      {subtitle && (
        <Text className="text-[10px] font-bold uppercase tracking-[0.2em] text-foreground-tertiary mb-3">
          {subtitle}
        </Text>
      )}
      <View className="flex-row items-center justify-between">
        <Text className="font-playfair-bold text-4xl text-foreground-heading leading-[1.1] flex-1">
          {title}
        </Text>
        {rightElement}
      </View>
    </View>
  );
}
