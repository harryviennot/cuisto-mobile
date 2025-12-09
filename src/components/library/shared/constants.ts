/**
 * Library Shared Constants
 *
 * Shared constants and type definitions for library components.
 */
import { SquaresFourIcon, BookmarkIcon, Package } from "phosphor-react-native";
import type { Icon } from "phosphor-react-native";

// Collection slugs - will expand as library grows (cooking-history, cookbooks, etc.)
export const COLLECTION_SLUGS = ["extracted", "saved"] as const;
export type CollectionSlug = (typeof COLLECTION_SLUGS)[number];

// Collection slug to icon mapping
export const COLLECTION_ICONS: Record<string, Icon> = {
  extracted: SquaresFourIcon,
  saved: BookmarkIcon,
};

// Fallback icon for unknown collection types
export const DEFAULT_COLLECTION_ICON = Package;
