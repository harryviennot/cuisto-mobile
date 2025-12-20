/**
 * Extraction step translation utilities
 *
 * Provides helper functions for translating extraction step codes
 * from the backend into localized strings.
 */
import type { TFunction } from "i18next";

/**
 * Known extraction step codes that have translations.
 * This list should match the keys in extraction.steps in en.json/fr.json
 */
const KNOWN_STEP_CODES = new Set([
  "starting",
  "complete",
  "video_downloading",
  "video_extracting_audio",
  "video_transcribing",
  "video_combining",
  "photo_ocr_single",
  "photo_ocr_multiple",
  "photo_extracting",
  "voice_transcribing",
  "link_fetching",
  "link_parsing",
  "link_extracting",
  "link_finding_image",
  "link_extracting_text",
  "paste_processing",
  "normalizing",
  "preparing",
  "generating_image",
  "saving",
  // Client-side download steps (Instagram flow)
  "client_downloading",
  "client_uploading",
]);

/**
 * Translate an extraction step code to a localized string.
 *
 * @param t - The i18next translation function
 * @param step - The step code from the backend (e.g., "video_downloading")
 * @returns The translated string, or the original step code if unknown
 */
export function getExtractionStepText(t: TFunction, step?: string): string | undefined {
  if (!step) return undefined;

  // Check if this is a known step code with a translation
  if (KNOWN_STEP_CODES.has(step)) {
    // Use type assertion since we know the key exists
    return t(`extraction.steps.${step}` as "extraction.steps.starting");
  }

  // For unknown steps, return the raw step code
  // This handles backward compatibility with any legacy string messages
  return step;
}
