/**
 * CategoryChip - A selectable category pill for the category filter
 */
import React, { useCallback } from "react";
import { Pressable, Text } from "react-native";
import * as Haptics from "expo-haptics";
import type { Icon } from "phosphor-react-native";
import {
  SquaresFour,
  ForkKnife,
  Leaf,
  Hamburger,
  Wine,
  Cookie,
  Bread,
  Coffee,
  Martini,
  Egg,
  BowlFood,
  Drop,
  Fire,
  Popcorn,
} from "phosphor-react-native";
import { ShadowItem } from "../ShadowedSection";

// Map category slugs to Phosphor icons
const CATEGORY_ICONS: Record<string, Icon> = {
  all: SquaresFour,
  "main-dishes": ForkKnife,
  soups: BowlFood,
  salads: Leaf,
  "pasta-noodles": ForkKnife,
  sandwiches: Hamburger,
  appetizers: Wine,
  apero: Wine,
  desserts: Cookie,
  "baked-goods": Bread,
  beverages: Coffee,
  cocktails: Martini,
  breakfast: Egg,
  sides: BowlFood,
  "sauces-dips": Drop,
  snacks: Popcorn,
  grilled: Fire,
  "bowls-grains": BowlFood,
};

interface CategoryChipProps {
  /** Category slug for icon lookup */
  slug: string;
  /** Display label (translated) */
  label: string;
  /** Whether this chip is currently selected */
  isSelected: boolean;
  /** Callback when chip is pressed */
  onPress: () => void;
}

export function CategoryChip({ slug, label, isSelected, onPress }: CategoryChipProps) {
  const IconComponent = CATEGORY_ICONS[slug] || ForkKnife;

  const handlePress = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  }, [onPress]);

  return (
    <ShadowItem
      onPress={handlePress}
      className={`flex-row gap-2 py-2.5 px-4 rounded-full ${isSelected && "border-primary bg-primary/10"}`}
      // className={`flex-row items-center gap-2 rounded-full px-4 py-2.5 border ${isSelected
      //     ? "border-primary bg-primary/10"
      //     : "border-border-light bg-surface-elevated"
      //   }`}
      style={({ pressed }) => ({
        opacity: pressed ? 0.7 : 1,
      })}
    >
      <IconComponent
        size={16}
        color={isSelected ? "#334d43" : "#8a8177"}
        weight={isSelected ? "fill" : "regular"}
      />
      <Text
        className={`text-sm font-semibold ${isSelected ? "text-primary" : "text-foreground-secondary"
          }`}
        numberOfLines={1}
      >
        {label}
      </Text>
    </ShadowItem>
  );
}
