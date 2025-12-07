/**
 * HorizontalPreviewSection
 *
 * A generic, reusable horizontal scroll section component.
 * Used for discovery sections on home page and cooking history preview on library page.
 *
 * Features:
 * - Section header with title, divider line, and "See more" button
 * - Horizontal FlatList with configurable card dimensions
 * - Loading state with skeleton placeholders
 * - Auto-hides when data is below minimum threshold
 * - Generic type support for any data shape
 */
import React, { useCallback } from "react";
import {
  View,
  FlatList,
  StyleProp,
  ViewStyle,
  TouchableOpacity,
  Text,
  ListRenderItem,
} from "react-native";
import { useTranslation } from "react-i18next";

// Default constants
const DEFAULT_CARD_WIDTH = 110;
const DEFAULT_CARD_GAP = 12;
const DEFAULT_MIN_ITEMS = 3;
const DEFAULT_SKELETON_COUNT = 4;

export interface HorizontalPreviewSectionProps<T> {
  /** Section title (displayed in uppercase) */
  title: string;
  /** Data array to display */
  data: T[] | undefined;
  /** Render function for each item */
  renderItem: (item: T, index: number) => React.ReactNode;
  /** Key extractor for FlatList */
  keyExtractor: (item: T) => string;
  /** Callback when "See more" is pressed */
  onSeeMore?: () => void;
  /** "See more" button text (defaults to i18n common.seeMore) */
  seeMoreText?: string;
  /** Loading state */
  isLoading?: boolean;
  /** Error state - section will not render on error */
  isError?: boolean;
  /** Skeleton component to show during loading */
  SkeletonComponent?: React.ComponentType<{ width: number }>;
  /** Number of skeletons to show during loading */
  skeletonCount?: number;
  /** Minimum items required to show the section (default: 3) */
  minItems?: number;
  /** Width of each card (default: 110) */
  cardWidth?: number;
  /** Gap between cards (default: 12) */
  cardGap?: number;
  /** Custom style for the container */
  style?: StyleProp<ViewStyle>;
  /** Custom style for the content container */
  contentContainerStyle?: StyleProp<ViewStyle>;
  /** Horizontal padding for the list (default: 20) */
  horizontalPadding?: number;
}

function HorizontalPreviewSectionInner<T>(
  {
    title,
    data,
    renderItem,
    keyExtractor,
    onSeeMore,
    seeMoreText,
    isLoading = false,
    isError = false,
    SkeletonComponent,
    skeletonCount = DEFAULT_SKELETON_COUNT,
    minItems = DEFAULT_MIN_ITEMS,
    cardWidth = DEFAULT_CARD_WIDTH,
    cardGap = DEFAULT_CARD_GAP,
    style,
    contentContainerStyle,
    horizontalPadding = 20,
  }: HorizontalPreviewSectionProps<T>,
  _ref: React.Ref<View>
) {
  const { t } = useTranslation();

  // Don't render section if there's an error
  if (isError) {
    return null;
  }

  // Render skeleton during loading
  if (isLoading) {
    return (
      <View style={style}>
        <SectionHeader
          title={title}
          onSeeMore={onSeeMore}
          seeMoreText={seeMoreText || t("common.seeMore")}
        />
        {SkeletonComponent ? (
          <FlatList
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={[
              { paddingHorizontal: horizontalPadding, gap: cardGap },
              contentContainerStyle,
            ]}
            data={Array.from({ length: skeletonCount }, (_, i) => i)}
            keyExtractor={(item) => item.toString()}
            renderItem={() => <SkeletonComponent width={cardWidth} />}
          />
        ) : (
          <View style={{ height: 150 }} />
        )}
      </View>
    );
  }

  // Don't render section if no data or below minimum threshold
  if (!data || data.length < minItems) {
    return null;
  }

  const renderListItem: ListRenderItem<T> = useCallback(
    ({ item, index }) => <>{renderItem(item, index)}</>,
    [renderItem]
  );

  return (
    <View style={style}>
      <SectionHeader
        title={title}
        onSeeMore={onSeeMore}
        seeMoreText={seeMoreText || t("common.seeMore")}
      />
      <FlatList
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={[
          { paddingHorizontal: horizontalPadding, gap: cardGap },
          contentContainerStyle,
        ]}
        data={data}
        keyExtractor={keyExtractor}
        renderItem={renderListItem}
      />
    </View>
  );
}

// Section header sub-component
interface SectionHeaderProps {
  title: string;
  onSeeMore?: () => void;
  seeMoreText: string;
}

function SectionHeader({ title, onSeeMore, seeMoreText }: SectionHeaderProps) {
  return (
    <View className="mb-4 flex-row items-center gap-3 px-6">
      <Text className="font-bold shrink-0 text-sm uppercase tracking-widest text-foreground-tertiary">
        {title}
      </Text>
      <View className="h-px flex-1 bg-border-light" />
      {onSeeMore && (
        <TouchableOpacity onPress={onSeeMore} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Text className="text-xs font-bold text-primary">{seeMoreText}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

// Export with forwardRef for generic support
export const HorizontalPreviewSection = React.forwardRef(HorizontalPreviewSectionInner) as <T>(
  props: HorizontalPreviewSectionProps<T> & { ref?: React.Ref<View> }
) => React.ReactElement | null;
