/**
 * Cooking History Preview
 *
 * Horizontal scroll section displaying recent cooking history on the library page.
 * Uses the generic HorizontalPreviewSection component.
 */
import React from "react";
import { StyleProp, ViewStyle } from "react-native";
import { useTranslation } from "react-i18next";
import { CookingHistoryCard, CookingHistoryCardSkeleton } from "./CookingHistoryCard";
import { HorizontalPreviewSection } from "@/components/ui/HorizontalPreviewSection";
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

export function CookingHistoryPreview({
  onSeeMore,
  style,
  limit = 10,
}: CookingHistoryPreviewProps) {
  const { t } = useTranslation();
  const { data: events, isLoading, isError } = useCookingHistoryPreview(limit);

  return (
    <HorizontalPreviewSection<CookingHistoryEvent>
      title={t("cookingHistory.title")}
      data={events}
      renderItem={(event) => <CookingHistoryCard event={event} width={CARD_WIDTH} />}
      keyExtractor={(event) => event.event_id}
      onSeeMore={onSeeMore}
      seeMoreText={t("cookingHistory.seeMore")}
      isLoading={isLoading}
      isError={isError}
      SkeletonComponent={CookingHistoryCardSkeleton}
      minItems={1} // Show cooking history even with 1 item
      cardWidth={CARD_WIDTH}
      style={style}
    />
  );
}
