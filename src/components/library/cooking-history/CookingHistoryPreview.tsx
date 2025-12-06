/**
 * Cooking History Preview
 *
 * Horizontal scroll section displaying recent cooking history on the library page.
 * Includes section header with "See more" button and a horizontal FlatList.
 */
import React from "react";
import { View, FlatList, StyleProp, ViewStyle, TouchableOpacity, Text } from "react-native";
import { useTranslation } from "react-i18next";
import { CookingHistoryCard, CookingHistoryCardSkeleton } from "./CookingHistoryCard";
import { useCookingHistoryPreview } from "@/hooks/useCookingHistory";
import type { CookingHistoryEvent } from "@/types/cookingHistory";

export interface CookingHistoryPreviewProps {
  /** Callback when "See more" is pressed */
  onSeeMore?: () => void;
  /** Custom style for the container */
  style?: StyleProp<ViewStyle>;
  /** Number of items to show (default: 10) */
  limit?: number;
}

const CARD_WIDTH = 110;
const CARD_GAP = 12;

export function CookingHistoryPreview({
  onSeeMore,
  style,
  limit = 10,
}: CookingHistoryPreviewProps) {
  const { t } = useTranslation();
  const { data: events, isLoading, isError } = useCookingHistoryPreview(limit);

  // Don't render section if there's an error or no data (after loading)
  if (isError) {
    return null;
  }

  // Show skeleton while loading
  if (isLoading) {
    return (
      <View style={style}>
        <View className="mb-4 flex-row items-center gap-3 px-5">
          <Text className="font-bold shrink-0 text-sm uppercase tracking-widest text-foreground-tertiary">
            {t("cookingHistory.title")}
          </Text>
          <View className="h-px flex-1 bg-border-light" />
        </View>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 20, gap: CARD_GAP }}
          data={[1, 2, 3, 4]}
          keyExtractor={(item) => item.toString()}
          renderItem={() => <CookingHistoryCardSkeleton width={CARD_WIDTH} />}
        />
      </View>
    );
  }

  // Don't render section if no cooking history
  if (!events || events.length === 0) {
    return null;
  }

  const renderItem = ({ item }: { item: CookingHistoryEvent }) => (
    <CookingHistoryCard event={item} width={CARD_WIDTH} />
  );

  return (
    <View style={style}>
      <View className="mb-4 flex-row items-center gap-3 px-6">
        <Text className="font-bold shrink-0 text-sm uppercase tracking-widest text-foreground-tertiary">
          {t("cookingHistory.title")}
        </Text>
        <View className="h-px flex-1 bg-border-light" />
        {onSeeMore && (
          <TouchableOpacity onPress={onSeeMore}>
            <Text className="text-xs font-bold text-primary ">{t("cookingHistory.seeMore")}</Text>
          </TouchableOpacity>
        )}
      </View>
      <FlatList
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 20, gap: CARD_GAP }}
        data={events}
        keyExtractor={(item) => item.event_id}
        renderItem={renderItem}
      />
    </View>
  );
}
