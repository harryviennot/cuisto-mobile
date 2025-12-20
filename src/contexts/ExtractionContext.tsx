/**
 * Extraction Context
 *
 * Manages active extraction jobs with real-time SSE updates.
 * Allows users to minimize extractions and continue browsing while
 * recipes are being extracted in the background.
 *
 * Features:
 * - Global state for all active extraction jobs
 * - SSE connections managed at root level (survive navigation)
 * - Minimize/expand functionality for non-blocking UX
 * - Premium feature gate for multiple concurrent extractions
 */
import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from "react";
import RNEventSource from "react-native-sse";
import { supabase } from "@/lib/supabase";
import { API_URL } from "@/api/api-client";
import { extractionService, SubmitExtractionRequest } from "@/api/services/extraction.service";
import { videoDownloadService, VideoDownloadProgress } from "@/api/services/video-download.service";
import type { ExtractionJob as BaseExtractionJob, ExtractionStatus } from "@/types/extraction";

// ============================================================================
// TYPES
// ============================================================================

/**
 * Extended extraction job with UI state
 */
export interface ExtractionJob extends BaseExtractionJob {
  /** Whether this job is currently minimized to the widget */
  isMinimized: boolean;
  /** Timestamp for ordering multiple jobs */
  createdAt: number;
  /** Client-side download progress (0-100) - for Instagram */
  clientDownloadProgress?: number;
  /** Client-side upload progress (0-100) - for Instagram */
  clientUploadProgress?: number;
  /** Whether client download is in progress */
  isClientDownloading?: boolean;
}

/**
 * Terminal statuses that indicate the job is complete
 */
const TERMINAL_STATUSES: ExtractionStatus[] = [
  "completed" as ExtractionStatus,
  "failed" as ExtractionStatus,
  "not_a_recipe" as ExtractionStatus,
  "website_blocked" as ExtractionStatus,
];

interface ExtractionContextType {
  /** All active extraction jobs */
  activeJobs: ExtractionJob[];

  /** Jobs that are currently minimized */
  minimizedJobs: ExtractionJob[];

  /** Whether there are any minimized jobs */
  hasMinimizedJobs: boolean;

  /**
   * Submit content for recipe extraction
   * @returns The job ID
   */
  startExtraction: (request: SubmitExtractionRequest) => Promise<string>;

  /**
   * Submit images for recipe extraction
   * @returns The job ID
   */
  startImageExtraction: (formData: FormData) => Promise<string>;

  /**
   * Minimize a job to the widget
   */
  minimizeJob: (jobId: string) => void;

  /**
   * Expand a job from the widget (navigate to preview)
   */
  expandJob: (jobId: string) => void;

  /**
   * Remove a job from tracking (after save/discard)
   */
  dismissJob: (jobId: string) => void;

  /**
   * Cancel an extraction job
   */
  cancelJob: (jobId: string) => Promise<void>;

  /**
   * Get a specific job by ID
   */
  getJob: (jobId: string) => ExtractionJob | undefined;

  /**
   * Check if user can start a new extraction
   * (Premium feature gate for multiple concurrent extractions)
   */
  canStartNewExtraction: () => boolean;

  /**
   * Number of in-progress extractions
   */
  inProgressCount: number;
}

const ExtractionContext = createContext<ExtractionContextType | undefined>(undefined);

// ============================================================================
// PROVIDER
// ============================================================================

interface SSEConnection {
  eventSource: RNEventSource;
  cleanup: () => void;
}

export function ExtractionProvider({ children }: { children: React.ReactNode }) {
  const [activeJobs, setActiveJobs] = useState<ExtractionJob[]>([]);

  // Track SSE connections by job ID
  const sseConnectionsRef = useRef<Map<string, SSEConnection>>(new Map());

  // Refs for cleanup
  const isUnmountedRef = useRef(false);

  // Ref for createSSEConnection to avoid circular dependency
  const createSSEConnectionRef = useRef<((jobId: string) => Promise<void>) | null>(null);

  // ============================================================================
  // HELPER FUNCTIONS
  // ============================================================================

  /**
   * Update a job in the active jobs list
   */
  const updateJob = useCallback((jobId: string, updates: Partial<ExtractionJob>) => {
    setActiveJobs((prev) => prev.map((job) => (job.id === jobId ? { ...job, ...updates } : job)));
  }, []);

  /**
   * Close SSE connection for a job
   */
  const closeSSEConnection = useCallback((jobId: string) => {
    const connection = sseConnectionsRef.current.get(jobId);
    if (connection) {
      connection.cleanup();
      sseConnectionsRef.current.delete(jobId);
      console.log(`[Extraction] Closed SSE connection for job ${jobId}`);
    }
  }, []);

  /**
   * Handle client-side video download flow (Instagram)
   * Downloads video using user's IP, uploads to server, resumes extraction
   */
  const handleClientDownload = useCallback(
    async (jobId: string, downloadUrl: string) => {
      // Check if already downloading
      const job = activeJobs.find((j) => j.id === jobId);
      if (job?.isClientDownloading) {
        console.log(`[Extraction] Already downloading for job ${jobId}`);
        return;
      }

      console.log(`[Extraction] Starting client download for job ${jobId}`);

      // Mark as downloading
      updateJob(jobId, {
        isClientDownloading: true,
        current_step: "client_downloading",
        clientDownloadProgress: 0,
      });

      try {
        // Step 1: Download video
        const downloadResult = await videoDownloadService.downloadVideo(
          downloadUrl,
          (progress: VideoDownloadProgress) => {
            updateJob(jobId, {
              clientDownloadProgress: progress.percentage,
              // Scale download to 10-35% of total progress (25% range)
              progress_percentage: 10 + Math.round(progress.percentage * 0.25),
            });
          }
        );

        // Step 2: Upload to server
        updateJob(jobId, {
          current_step: "client_uploading",
          clientUploadProgress: 0,
        });

        const uploadResult = await videoDownloadService.uploadVideo(
          downloadResult.localUri,
          jobId,
          (percentage: number) => {
            updateJob(jobId, {
              clientUploadProgress: percentage,
              // Scale upload to 35-50% of total progress (15% range)
              progress_percentage: 35 + Math.round(percentage * 0.15),
            });
          }
        );

        // Step 3: Cleanup local file
        await videoDownloadService.cleanupLocalVideo(downloadResult.localUri);

        // Step 4: Resume extraction on server
        await videoDownloadService.resumeExtraction(jobId, uploadResult.path);

        // Update job - SSE will pick up remaining progress from backend (starts at 50%)
        updateJob(jobId, {
          isClientDownloading: false,
          status: "processing" as ExtractionStatus,
          current_step: "video_extracting_audio",
          // Don't set progress_percentage - let SSE provide it from backend
        });

        // Reconnect SSE to get remaining updates
        if (createSSEConnectionRef.current) {
          createSSEConnectionRef.current(jobId);
        }
      } catch (error) {
        console.error(`[Extraction] Client download failed for job ${jobId}:`, error);

        updateJob(jobId, {
          isClientDownloading: false,
          status: "failed" as ExtractionStatus,
          error_message:
            error instanceof Error ? error.message : "Failed to download video from Instagram",
          progress_percentage: 0,
        });
      }
    },
    [activeJobs, updateJob]
  );

  /**
   * Create SSE connection for a job
   */
  const createSSEConnection = useCallback(
    async (jobId: string) => {
      // Don't create if already connected
      if (sseConnectionsRef.current.has(jobId)) {
        console.log(`[Extraction] SSE already exists for job ${jobId}`);
        return;
      }

      // Get auth token
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const token = session?.access_token;

      if (!token) {
        console.error(`[Extraction] No auth token for job ${jobId}`);
        updateJob(jobId, {
          status: "failed" as ExtractionStatus,
          error_message: "Authentication required. Please log in again.",
        });
        return;
      }

      const url = `${API_URL}/api/v1/extraction/jobs/${jobId}/stream`;
      console.log(`[Extraction] Creating SSE connection for job ${jobId}`);

      try {
        const eventSource = new RNEventSource(url, {
          headers: { Authorization: `Bearer ${token}` },
        }) as RNEventSource;

        let isCompleted = false;

        const cleanup = () => {
          eventSource.close();
        };

        // @ts-expect-error - RNEventSource types are incomplete
        eventSource.addEventListener("job_update", (event: { data: string }) => {
          if (isUnmountedRef.current || isCompleted) return;

          try {
            const data = typeof event.data === "string" ? JSON.parse(event.data) : event.data;

            console.log(
              `[Extraction] SSE update for ${jobId}: ${data.progress_percentage}% - ${data.current_step}`,
              `status=${data.status}`,
              data.video_download_url
                ? `video_url=${data.video_download_url.substring(0, 50)}...`
                : "",
              data.recipe_id ? `recipe_id=${data.recipe_id}` : "",
              data.existing_recipe_id ? `existing_recipe_id=${data.existing_recipe_id}` : ""
            );

            // Update job state
            updateJob(jobId, {
              status: data.status,
              progress_percentage: data.progress_percentage,
              current_step: data.current_step,
              recipe_id: data.recipe_id,
              existing_recipe_id: data.existing_recipe_id,
              error_message: data.error_message,
              video_download_url: data.video_download_url,
              video_metadata: data.video_metadata,
            });

            // Handle needs_client_download status (Instagram)
            if (data.status === "needs_client_download" && data.video_download_url) {
              console.log(`[Extraction] Job ${jobId} needs client download`);
              isCompleted = true;
              closeSSEConnection(jobId);
              // Trigger client-side download flow
              handleClientDownload(jobId, data.video_download_url);
              return;
            }

            // Close connection on terminal states
            if (TERMINAL_STATUSES.includes(data.status)) {
              console.log(`[Extraction] Job ${jobId} completed via SSE`);
              isCompleted = true;
              closeSSEConnection(jobId);
            }
          } catch (err) {
            console.error(`[Extraction] Failed to parse SSE data for ${jobId}:`, err);
          }
        });

        // @ts-expect-error - RNEventSource types are incomplete
        eventSource.onerror = () => {
          if (isUnmountedRef.current || isCompleted) return;

          console.error(`[Extraction] SSE connection error for job ${jobId}`);
          closeSSEConnection(jobId);
          updateJob(jobId, {
            status: "failed" as ExtractionStatus,
            error_message: "Connection lost. Please try again.",
          });
        };

        sseConnectionsRef.current.set(jobId, { eventSource, cleanup });
      } catch (error) {
        console.error(`[Extraction] Failed to create SSE for job ${jobId}:`, error);
        updateJob(jobId, {
          status: "failed" as ExtractionStatus,
          error_message: "Failed to connect. Please try again.",
        });
      }
    },
    [updateJob, closeSSEConnection, handleClientDownload]
  );

  // Store createSSEConnection in ref to break circular dependency
  createSSEConnectionRef.current = createSSEConnection;

  // ============================================================================
  // PUBLIC API
  // ============================================================================

  /**
   * Check if user can start a new extraction
   * For now, allow only one in-progress extraction for free users
   * TODO: Integrate with premium/subscription status
   */
  const canStartNewExtraction = useCallback((): boolean => {
    // const inProgressJobs = activeJobs.filter(
    //   (job) => job.status === ("pending" as ExtractionStatus) || job.status === ("processing" as ExtractionStatus)
    // );
    // For now, allow only 1 concurrent extraction
    // TODO: Check isPremium from auth/subscription context
    const isPremium = false;
    return isPremium || activeJobs.length === 0;
  }, [activeJobs]);

  /**
   * Start a new extraction
   */
  const startExtraction = useCallback(
    async (request: SubmitExtractionRequest): Promise<string> => {
      // Submit to API
      const job = await extractionService.submit(request);

      // Add to active jobs with extended properties
      const extendedJob: ExtractionJob = {
        ...job,
        isMinimized: false,
        createdAt: Date.now(),
      };

      setActiveJobs((prev) => [...prev, extendedJob]);

      // Start SSE connection
      createSSEConnection(job.id);

      return job.id;
    },
    [createSSEConnection]
  );

  /**
   * Start an image extraction
   */
  const startImageExtraction = useCallback(
    async (formData: FormData): Promise<string> => {
      // Submit to API
      const response = await extractionService.submitImages(formData);
      const jobId = response.job_id;

      // Fetch full job details
      const job = await extractionService.getJob(jobId);

      // Add to active jobs
      const extendedJob: ExtractionJob = {
        ...job,
        isMinimized: false,
        createdAt: Date.now(),
      };

      setActiveJobs((prev) => [...prev, extendedJob]);

      // Start SSE connection
      createSSEConnection(jobId);

      return jobId;
    },
    [createSSEConnection]
  );

  /**
   * Minimize a job to the widget
   */
  const minimizeJob = useCallback(
    (jobId: string) => {
      updateJob(jobId, { isMinimized: true });
    },
    [updateJob]
  );

  /**
   * Expand a job from the widget
   */
  const expandJob = useCallback(
    (jobId: string) => {
      updateJob(jobId, { isMinimized: false });
    },
    [updateJob]
  );

  /**
   * Dismiss/remove a job from tracking
   */
  const dismissJob = useCallback(
    (jobId: string) => {
      // Clean up connections
      closeSSEConnection(jobId);

      // Remove from active jobs
      setActiveJobs((prev) => prev.filter((job) => job.id !== jobId));
    },
    [closeSSEConnection]
  );

  /**
   * Cancel an extraction job
   * Only sends cancel request if job is actually cancellable (pending/processing)
   */
  const cancelJob = useCallback(
    async (jobId: string) => {
      const job = activeJobs.find((j) => j.id === jobId);

      // Only try to cancel if job is in a cancellable state
      if (
        job &&
        (job.status === ("pending" as ExtractionStatus) ||
          job.status === ("processing" as ExtractionStatus))
      ) {
        try {
          await extractionService.cancelJob(jobId);
        } catch (error) {
          console.warn(`[Extraction] Failed to cancel job ${jobId}:`, error);
        }
      }

      dismissJob(jobId);
    },
    [activeJobs, dismissJob]
  );

  /**
   * Get a specific job by ID
   */
  const getJob = useCallback(
    (jobId: string): ExtractionJob | undefined => {
      return activeJobs.find((job) => job.id === jobId);
    },
    [activeJobs]
  );

  // ============================================================================
  // DERIVED STATE
  // ============================================================================

  const minimizedJobs = activeJobs.filter((job) => job.isMinimized);
  const hasMinimizedJobs = minimizedJobs.length > 0;
  const inProgressCount = activeJobs.filter(
    (job) =>
      job.status === ("pending" as ExtractionStatus) ||
      job.status === ("processing" as ExtractionStatus)
  ).length;

  // ============================================================================
  // CLEANUP
  // ============================================================================

  useEffect(() => {
    // Copy ref to local variable for cleanup
    const sseConnections = sseConnectionsRef.current;

    return () => {
      isUnmountedRef.current = true;

      // Clean up all SSE connections
      sseConnections.forEach((connection) => {
        connection.cleanup();
      });
      sseConnections.clear();
    };
  }, []);

  // ============================================================================
  // CONTEXT VALUE
  // ============================================================================

  const value: ExtractionContextType = {
    activeJobs,
    minimizedJobs,
    hasMinimizedJobs,
    startExtraction,
    startImageExtraction,
    minimizeJob,
    expandJob,
    dismissJob,
    cancelJob,
    getJob,
    canStartNewExtraction,
    inProgressCount,
  };

  return <ExtractionContext.Provider value={value}>{children}</ExtractionContext.Provider>;
}

// ============================================================================
// HOOK
// ============================================================================

/**
 * Hook to access the extraction context
 */
export function useExtraction() {
  const context = useContext(ExtractionContext);
  if (context === undefined) {
    throw new Error("useExtraction must be used within an ExtractionProvider");
  }
  return context;
}
