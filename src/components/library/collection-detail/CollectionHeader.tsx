/**
 * Collection Header
 *
 * Large scrolling header with subtitle and title for collection detail pages.
 * This header scrolls with the content (not sticky).
 */
import React from "react";
import { View, Text } from "react-native";

export interface CollectionHeaderProps {
  /** Small uppercase subtitle text */
  subtitle: string;
  /** Large title text */
  title: string;
  /** Top padding (usually safe area + sticky header height) */
  topPadding: number;
}

export function CollectionHeader({ subtitle, title, topPadding }: CollectionHeaderProps) {
  return (
    <View
      style={{
        paddingTop: topPadding,
        paddingHorizontal: 20,
        paddingBottom: 24,
      }}
    >
      <Text className="text-[10px] font-bold uppercase tracking-[0.2em] text-foreground-tertiary mb-3">
        {subtitle}
      </Text>
      <Text className="font-playfair-bold text-4xl text-foreground-heading leading-[1.1]">
        {title}
      </Text>
    </View>
  );
}
