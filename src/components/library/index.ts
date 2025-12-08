/**
 * Library Components
 *
 * Components for the Library screen and related features.
 */

// Section header (reusable)
export { SectionHeader } from "./SectionHeader";
export type { SectionHeaderProps } from "./SectionHeader";

// Shared components (reusable across library features)
export {
  CollectionLoadingSkeleton,
  COLLECTION_ICONS,
  COLLECTION_SLUGS,
  DEFAULT_COLLECTION_ICON,
  getCountStyle,
} from "./shared";
export type { CollectionSlug, CollectionLoadingSkeletonProps } from "./shared";

// Cooking history components
export {
  CookingHistoryCard,
  CookingHistoryCardSkeleton,
  CookingHistoryListItem,
  CookingHistoryListItemSkeleton,
  CookingHistoryPreview,
  CookingHistoryEmpty,
  ViewToggle,
  formatRelativeDate,
  formatDuration,
} from "./cooking-history";
export type {
  CookingHistoryCardProps,
  CookingHistoryListItemProps,
  CookingHistoryPreviewProps,
  CookingHistoryEmptyProps,
  ViewToggleProps,
  ViewMode,
} from "./cooking-history";

export type { SmartCollectionCardProps } from "./SmartCollectionCard";
export { SmartCollectionCard } from "./SmartCollectionCard";
