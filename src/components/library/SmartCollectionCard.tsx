/**
 * Smart Collection Card
 *
 * Card component for displaying collections on the library main screen.
 * Features a background count number, icon, title, and subtitle.
 */
import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { useTranslation } from "react-i18next";
import { SquaresFourIcon, BookmarkIcon } from "phosphor-react-native";

import { getCountStyle } from "./shared/utils";
import type { CollectionSlug } from "./shared/constants";

export interface SmartCollectionCardProps {
  /** Collection slug identifier */
  slug: CollectionSlug;
  /** Number of items in the collection */
  count?: number;
  /** Visual variant - primary (dark bg) or secondary (light bg) */
  variant: "primary" | "secondary";
  /** Callback when card is pressed */
  onPress: () => void;
  /** Optional test ID for testing */
  testID?: string;
}

// Slug to icon mapping
const SLUG_ICONS = {
  extracted: SquaresFourIcon,
  saved: BookmarkIcon,
} as const;

// Slug to i18n key mapping
const SLUG_I18N_KEYS = {
  extracted: {
    title: "library.collections.allRecipes",
    subtitle: "library.collections.allRecipesSubtitle",
  },
  saved: {
    title: "library.collections.favorites",
    subtitle: "library.collections.favoritesSubtitle",
  },
} as const;

export function SmartCollectionCard({
  slug,
  count = 0,
  variant,
  onPress,
  testID,
}: SmartCollectionCardProps) {
  const { t } = useTranslation();

  const IconComponent = SLUG_ICONS[slug];
  const i18nKeys = SLUG_I18N_KEYS[slug];
  const countStyle = getCountStyle(count);

  const isPrimary = variant === "primary";

  return (
    <View
      className={`relative flex-1 max-h-48 rounded-2xl overflow-hidden aspect-[4/3] ${isPrimary ? "bg-primary" : "bg-white border border-border-light"
        }`}
      testID={testID}
    >
      {/* Background Count Number */}
      <Text
        className={`absolute -right-4 font-playfair font-bold leading-none opacity-10 ${isPrimary ? "text-surface-texture-light" : "text-surface-texture-dark"
          }`}
        style={countStyle}
        allowFontScaling={false}
      >
        {count}
      </Text>

      <TouchableOpacity
        activeOpacity={0.9}
        onPress={onPress}
        className="flex-1 p-5 justify-between"
      >
        {/* Icon Container */}
        <View
          className={`w-10 h-10 rounded-full items-center justify-center ${isPrimary ? "bg-white/10" : "bg-stone-50"
            }`}
        >
          <IconComponent size={20} color={isPrimary ? "#fff" : "#3a3226"} weight="duotone" />
        </View>

        {/* Title & Subtitle */}
        <View>
          <Text
            className={`font-playfair-bold text-lg mb-0.5 ${isPrimary ? "text-white" : "text-foreground-heading"
              }`}
            numberOfLines={1}
            adjustsFontSizeToFit
          >
            {t(i18nKeys.title)}
          </Text>
          <Text
            className={`text-[10px] font-bold tracking-widest uppercase ${isPrimary ? "text-white/60" : "text-foreground-tertiary"
              }`}
            numberOfLines={1}
            adjustsFontSizeToFit
          >
            {t(i18nKeys.subtitle)}
          </Text>
        </View>
      </TouchableOpacity>
    </View>
  );
}
