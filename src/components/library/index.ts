/**
 * Library Components
 *
 * Components for the Library screen and related features.
 */

// Main library header
export { LibraryHeader } from "./LibraryHeader";

// Shared components (reusable across library features)
export {
  CollectionEmptyState,
  CollectionErrorState,
  CollectionLoadingSkeleton,
  CollectionStickyHeader,
  COLLECTION_ICONS,
  COLLECTION_SLUGS,
  DEFAULT_COLLECTION_ICON,
  getCountStyle,
} from "./shared";
export type {
  CollectionSlug,
  CollectionEmptyStateProps,
  CollectionErrorStateProps,
  CollectionLoadingSkeletonProps,
  CollectionStickyHeaderProps,
} from "./shared";

// Smart collection components (library main screen)
export { SmartCollectionCard, SmartCollectionCardSkeleton } from "./smart-collections";
export type {
  SmartCollectionCardProps,
  SmartCollectionCardSkeletonProps,
} from "./smart-collections";

// Collection detail components
export { CollectionHeader } from "./collection-detail";
export type { CollectionHeaderProps } from "./collection-detail";

// Legacy export alias for backwards compatibility
export { SmartCollectionCardSkeleton as CollectionCardSkeleton } from "./smart-collections";
