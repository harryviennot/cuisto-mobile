/**
 * Extraction method configurations
 * Define all available recipe extraction methods here
 */
import React from "react";

export type ExtractionMethodType = "image" | "video" | "url" | "voice" | "paste";
export type ExtractionSourceType = "camera" | "gallery" | "url" | "voice" | "paste" | "video";

export interface ExtractionMethodConfig {
  id: ExtractionSourceType;
  type: ExtractionMethodType;
  label: string;
  icon: React.ReactNode;
  maxItems?: number;
  allowMultiple?: boolean;
}

export interface ExtractionMethodGroup {
  type: ExtractionMethodType;
  label: string;
  methods: ExtractionMethodConfig[];
  maxItems: number;
  allowMultiple: boolean;
  requiresConfirmation: boolean;
}

/**
 * Configuration for image extraction methods
 */
export const IMAGE_EXTRACTION_METHODS: ExtractionMethodConfig[] = [
  {
    id: "camera",
    type: "image",
    label: "Take Photos",
    icon: null, // Will be set in component with proper icon
  },
  {
    id: "gallery",
    type: "image",
    label: "Choose from Gallery",
    icon: null,
  },
];

export const IMAGE_EXTRACTION_CONFIG = {
  maxItems: 3,
  allowMultiple: true,
  requiresConfirmation: true,
};

/**
 * Configuration for video extraction methods
 */
export const VIDEO_EXTRACTION_METHODS: ExtractionMethodConfig[] = [
  {
    id: "video",
    type: "video",
    label: "Import from Video Link",
    icon: null, // Will be set in component with proper icon
  },
];

/**
 * Future: URL extraction methods
 */
export const URL_EXTRACTION_METHODS: ExtractionMethodConfig[] = [];

/**
 * Future: Voice extraction methods
 */
export const VOICE_EXTRACTION_METHODS: ExtractionMethodConfig[] = [];

/**
 * Future: Paste/text extraction methods
 */
export const PASTE_EXTRACTION_METHODS: ExtractionMethodConfig[] = [];
