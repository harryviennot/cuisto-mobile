/**
 * Recipe extraction types
 */

export enum SourceType {
  VIDEO = "video", // Deprecated - use LINK instead
  PHOTO = "photo",
  PASTE = "paste",
  VOICE = "voice",
  LINK = "link", // Auto-detects video vs webpage
}

export enum ExtractionStatus {
  PENDING = "pending",
  PROCESSING = "processing",
  COMPLETED = "completed",
  FAILED = "failed",
  DUPLICATE = "duplicate", // Video already extracted by someone else
  NOT_A_RECIPE = "not_a_recipe", // Content doesn't contain a recipe
  WEBSITE_BLOCKED = "website_blocked", // Website blocks automated extraction
}

/**
 * Extraction step codes sent by the server.
 * These are used by the frontend to display localized progress messages.
 */
export enum ExtractionStep {
  // General steps
  STARTING = "starting",
  COMPLETE = "complete",

  // Video extraction (0-50% range in extraction phase)
  VIDEO_DOWNLOADING = "video_downloading",
  VIDEO_EXTRACTING_AUDIO = "video_extracting_audio",
  VIDEO_TRANSCRIBING = "video_transcribing",
  VIDEO_COMBINING = "video_combining",

  // Photo extraction
  PHOTO_OCR_SINGLE = "photo_ocr_single",
  PHOTO_OCR_MULTIPLE = "photo_ocr_multiple",
  PHOTO_EXTRACTING = "photo_extracting",

  // Voice extraction
  VOICE_TRANSCRIBING = "voice_transcribing",

  // Link extraction
  LINK_FETCHING = "link_fetching",
  LINK_PARSING = "link_parsing",
  LINK_EXTRACTING = "link_extracting",
  LINK_FINDING_IMAGE = "link_finding_image",
  LINK_EXTRACTING_TEXT = "link_extracting_text",

  // Paste extraction
  PASTE_PROCESSING = "paste_processing",

  // Normalization phase (50-100% range)
  NORMALIZING = "normalizing",
  PREPARING = "preparing",
  GENERATING_IMAGE = "generating_image",
  SAVING = "saving",
}

/**
 * Extraction job response from the server.
 *
 * The server creates a draft recipe during extraction, so when the job
 * completes, the recipe_id will always be present (either a new draft
 * or an existing recipe for duplicates).
 */
export interface ExtractionJob {
  id: string;
  user_id: string;
  source_type: SourceType;
  source_url?: string;
  source_urls?: string[];
  status: ExtractionStatus;
  /**
   * Recipe ID - present when a new draft recipe was created.
   */
  recipe_id?: string;
  /**
   * Existing recipe ID - present when duplicate video detected.
   * References the already-extracted recipe for this video.
   */
  existing_recipe_id?: string;
  error_message?: string;
  progress_percentage: number;
  current_step?: string;
  created_at: string;
  updated_at: string;
}

export interface ImageExtractionResponse {
  job_id: string;
  message: string;
  image_count: number;
}

/**
 * Response from saving a recipe to a collection
 */
export interface RecipeSaveResponse {
  recipe_id: string;
  collection_id: string;
  added_to_collection: boolean;
  /** True if the recipe was a draft that got published */
  was_draft: boolean;
}

/**
 * Request to save a recipe to a collection
 */
export interface SaveRecipeRequest {
  recipe_id: string;
  /** Optional - defaults to user's "extracted" collection */
  collection_id?: string;
  /** Whether the recipe should be publicly visible. Defaults to true if not specified. */
  is_public?: boolean;
}
