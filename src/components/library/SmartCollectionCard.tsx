/**
 * SmartCollectionCard Component
 *
 * Premium card component for displaying system collections (All Recipes, Favorites).
 * Features staggered animations, circular icon containers, and editorial typography.
 */
import React from "react";
import { View, Text, Pressable, type ViewStyle } from "react-native";
import { router } from "expo-router";
import { Package, Heart, type IconProps } from "phosphor-react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useTranslation } from "react-i18next";
import type { Collection } from "@/types/collection";
import { ShadowItem } from "../ShadowedSection";

// Icon and color mapping for collection types
const COLLECTION_CONFIG: Record<
  string,
  {
    Icon: React.ComponentType<IconProps>;
    color: string;
    titleKey: string;
    subtitleKey: string;
  }
> = {
  extracted: {
    Icon: Package,
    color: "#334d43", // primary
    titleKey: "library.collections.allRecipes",
    subtitleKey: "library.collections.allRecipesSubtitle",
  },
  saved: {
    Icon: Heart,
    color: "#c65d47", // terracotta
    titleKey: "library.collections.favorites",
    subtitleKey: "library.collections.favoritesSubtitle",
  },
};

interface SmartCollectionCardProps {
  collection: Collection;
  index: number;
}

export function SmartCollectionCard({ collection, index }: SmartCollectionCardProps) {
  const { t } = useTranslation();

  // Get config based on collection slug, with fallback
  const config = COLLECTION_CONFIG[collection.slug] || {
    Icon: Package,
    color: "#334d43",
    titleKey: collection.name,
    subtitleKey: "",
  };

  const { Icon, color } = config;

  const handlePress = () => {
    // Navigate using slug for system collections
    router.push(`/library/collection/${collection.slug}`);
  };

  // Style for the icon background (15% opacity of the icon color)
  const iconBackgroundStyle: ViewStyle = {
    backgroundColor: `${color}15`,
  };

  return (
    <Animated.View entering={FadeInDown.delay(index * 100).duration(400)}>
      <ShadowItem
        onPress={handlePress}
        variant="default"
        className="p-5 rounded-2xl"
      >
        {/* Header row: Icon and Count */}
        <View className="flex-row border border-red-500 w-full justify-between items-start mb-4">
          {/* Icon in circular container */}
          <View
            className="w-12 h-12 rounded-full items-center justify-center"
            style={iconBackgroundStyle}
          >
            <Icon size={24} color={color} weight="duotone" />
          </View>

          {/* Recipe count */}
          <Text className="font-playfair-bold text-3xl text-stone-300">
            {collection.recipe_count}
          </Text>
        </View>

        {/* Title and Subtitle */}
        <View>
          <Text className="font-playfair text-lg text-foreground-heading leading-tight mb-1">
            {t(config.titleKey as never)}
          </Text>
          {config.subtitleKey && (
            <Text className="text-[10px] font-bold uppercase tracking-[0.15em] text-foreground-tertiary">
              {t(config.subtitleKey as never)}
            </Text>
          )}
        </View>
      </ShadowItem>
    </Animated.View>
  );
}
