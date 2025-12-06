/**
 * Section Header Component
 *
 * A reusable header for sections with a title and optional "See more" button.
 * Used for horizontal scroll sections on the library page.
 */
import React from "react";
import { View, Text, Pressable } from "react-native";
import { useTranslation } from "react-i18next";
import { CaretRight } from "phosphor-react-native";

export interface SectionHeaderProps {
  /** Section title */
  title: string;
  /** Optional subtitle displayed above the title */
  subtitle?: string;
  /** Callback when "See more" is pressed */
  onSeeMore?: () => void;
  /** Whether to show the "See more" button (default: true if onSeeMore provided) */
  showSeeMore?: boolean;
  /** Custom "See more" text (uses i18n by default) */
  seeMoreText?: string;
}

export function SectionHeader({
  title,
  subtitle,
  onSeeMore,
  showSeeMore = !!onSeeMore,
  seeMoreText,
}: SectionHeaderProps) {
  const { t } = useTranslation();

  return (
    <View className="flex-row items-center justify-between mb-3">
      <View className="flex-1">
        {subtitle && (
          <Text className="text-[10px] font-bold tracking-widest uppercase text-foreground-tertiary mb-0.5">
            {subtitle}
          </Text>
        )}
        <Text className="font-playfair-bold text-lg text-foreground-heading">{title}</Text>
      </View>

      {showSeeMore && onSeeMore && (
        <Pressable
          onPress={onSeeMore}
          className="flex-row items-center gap-0.5 py-1 active:opacity-70"
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Text className="text-primary font-semibold text-sm">
            {seeMoreText || t("common.seeMore")}
          </Text>
          <CaretRight size={14} color="#334d43" weight="bold" />
        </Pressable>
      )}
    </View>
  );
}
