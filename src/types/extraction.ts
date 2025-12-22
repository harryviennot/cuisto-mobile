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

/**
 * Content types detected by the server.
 * The server dynamically detects content type using yt-dlp probing.
 */
export enum ContentType {
  VIDEO = "video", // Standard video with audio
  SLIDESHOW = "slideshow", // Image carousels (TikTok photo mode, Instagram carousels)
  IMAGE_POST = "image_post", // Single image with description
  WEBPAGE = "webpage", // Traditional recipe websites
  UNKNOWN = "unknown", // Needs fallback handling
}

export enum ExtractionStatus {
  PENDING = "pending",
  PROCESSING = "processing",
  COMPLETED = "completed",
  FAILED = "failed",
  DUPLICATE = "duplicate", // Video already extracted by someone else
  NOT_A_RECIPE = "not_a_recipe", // Content doesn't contain a recipe
  WEBSITE_BLOCKED = "website_blocked", // Website blocks automated extraction
  NEEDS_CLIENT_DOWNLOAD = "needs_client_download", // Client needs to download video (Instagram)
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
  GEMINI_TRANSCRIBING = "gemini_transcribing", // Gemini audio transcription (alternative to Whisper)

  // Slideshow extraction (for TikTok photo mode, Instagram carousels)
  SLIDESHOW_DOWNLOADING = "slideshow_downloading",
  SLIDESHOW_ANALYZING = "slideshow_analyzing",

  // Social post extraction (image posts with descriptions)
  SOCIAL_EXTRACTING = "social_extracting",
  VISION_ANALYZING = "vision_analyzing",

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

  // Client-side download steps (Instagram)
  CLIENT_DOWNLOADING = "client_downloading",
  CLIENT_UPLOADING = "client_uploading",
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
  /**
   * Content type detected by the server (video, slideshow, image_post, webpage).
   * Used for analytics and debugging.
   */
  content_type?: ContentType;
  /**
   * Extraction method used (video_whisper, video_gemini, slideshow_vision, etc.).
   * Used for cost tracking and benchmarking.
   */
  extraction_method?: string;
  /**
   * Direct MP4 URL for client-side download (Instagram).
   * Present when status is NEEDS_CLIENT_DOWNLOAD.
   */
  video_download_url?: string;
  /**
   * Video metadata from URL extraction (thumbnail, description, etc.)
   * Present when status is NEEDS_CLIENT_DOWNLOAD.
   */
  video_metadata?: {
    thumbnail_url?: string;
    description?: string;
    title?: string;
    platform?: string;
    duration?: number;
    uploader?: string;
  };
  /**
   * Path in temp storage for uploaded video.
   */
  temp_video_path?: string;
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
