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
  /** Bottom margin (optional) */
  bottomMargin?: number;
  /** Optional element to render on the right side of the header */
  rightElement?: React.ReactNode;
  /** When true, displays the last word on a new line with primary color and italic style */
  highlightLastWord?: boolean;

  newLine?: boolean;
}

export function PageHeader({
  title,
  subtitle,
  topPadding,
  rightElement,
  bottomMargin,
  highlightLastWord,
  newLine,
}: PageHeaderProps) {
  const renderTitle = () => {
    if (!highlightLastWord) {
      return (
        <Text className="font-playfair-bold text-4xl text-foreground-heading leading-[1.1] flex-1">
          {title}
        </Text>
      );
    }

    const words = title.split(" ");
    let lastWord = words.pop() || "";

    // If the last "word" is just punctuation (e.g., "?" or "!"), include the previous word
    const isPunctuationOnly = /^[?!.,;:]+$/.test(lastWord);
    if (isPunctuationOnly && words.length > 0) {
      lastWord = words.pop() + " " + lastWord;
    }

    const mainText = words.join(" ");

    return (
      <Text className="font-playfair-bold text-4xl text-foreground-heading leading-[1.1] flex-1">
        {mainText}
        {newLine ? "\n" : " "}
        <Text className="text-primary italic">{lastWord}</Text>
      </Text>
    );
  };

  return (
    <View
      style={{
        paddingTop: topPadding,
        paddingHorizontal: 20,
        paddingBottom: bottomMargin ?? 24,
      }}
    >
      {subtitle && (
        <Text className="text-[10px] font-bold uppercase tracking-[0.2em] text-foreground-tertiary mb-3">
          {subtitle}
        </Text>
      )}
      <View className={`flex-row justify-between ${newLine ? "items-end" : "items-center"} gap-3`}>
        {renderTitle()}
        {rightElement}
      </View>
    </View>
  );
}
