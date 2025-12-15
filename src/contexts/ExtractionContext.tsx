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
 * - Polling fallback when SSE fails
 * - Minimize/expand functionality for non-blocking UX
 * - Premium feature gate for multiple concurrent extractions
 */
import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useRef,
  useEffect,
} from "react";
import RNEventSource from "react-native-sse";
import { supabase } from "@/lib/supabase";
import { API_URL } from "@/api/api-client";
import { extractionService, SubmitExtractionRequest } from "@/api/services/extraction.service";
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

  // Track polling intervals for fallback
  const pollingIntervalsRef = useRef<Map<string, ReturnType<typeof setInterval>>>(new Map());

  // Refs for cleanup
  const isUnmountedRef = useRef(false);

  // ============================================================================
  // HELPER FUNCTIONS
  // ============================================================================

  /**
   * Update a job in the active jobs list
   */
  const updateJob = useCallback((jobId: string, updates: Partial<ExtractionJob>) => {
    setActiveJobs((prev) =>
      prev.map((job) => (job.id === jobId ? { ...job, ...updates } : job))
    );
  }, []);

  /**
   * Stop polling for a job
   */
  const stopPolling = useCallback((jobId: string) => {
    const interval = pollingIntervalsRef.current.get(jobId);
    if (interval) {
      clearInterval(interval);
      pollingIntervalsRef.current.delete(jobId);
      console.log(`[Extraction] Stopped polling for job ${jobId}`);
    }
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
   * Start polling for a job (fallback when SSE fails)
   */
  const startPolling = useCallback(
    (jobId: string) => {
      // Don't start if already polling
      if (pollingIntervalsRef.current.has(jobId)) return;

      console.log(`[Extraction] Starting polling fallback for job ${jobId}`);

      const interval = setInterval(async () => {
        if (isUnmountedRef.current) {
          stopPolling(jobId);
          return;
        }

        try {
          const job = await extractionService.getJob(jobId);

          if (isUnmountedRef.current) return;

          // Update the job state
          updateJob(jobId, {
            status: job.status,
            progress_percentage: job.progress_percentage,
            current_step: job.current_step,
            recipe_id: job.recipe_id,
            existing_recipe_id: job.existing_recipe_id,
            error_message: job.error_message,
          });

          // Stop polling if job is complete
          if (TERMINAL_STATUSES.includes(job.status)) {
            console.log(`[Extraction] Job ${jobId} completed via polling`);
            stopPolling(jobId);
          }
        } catch (error) {
          console.error(`[Extraction] Polling error for job ${jobId}:`, error);
        }
      }, 2000); // Poll every 2 seconds

      pollingIntervalsRef.current.set(jobId, interval);
    },
    [updateJob, stopPolling]
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
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      if (!token) {
        console.warn(`[Extraction] No auth token, using polling for job ${jobId}`);
        startPolling(jobId);
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
            const data = typeof event.data === "string"
              ? JSON.parse(event.data)
              : event.data;

            console.log(
              `[Extraction] SSE update for ${jobId}: ${data.progress_percentage}% - ${data.current_step}`
            );

            // Update job state
            updateJob(jobId, {
              status: data.status,
              progress_percentage: data.progress_percentage,
              current_step: data.current_step,
              recipe_id: data.recipe_id,
              existing_recipe_id: data.existing_recipe_id,
              error_message: data.error_message,
            });

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

          console.warn(`[Extraction] SSE error for job ${jobId}, falling back to polling`);
          closeSSEConnection(jobId);
          startPolling(jobId);
        };

        sseConnectionsRef.current.set(jobId, { eventSource, cleanup });
      } catch (error) {
        console.error(`[Extraction] Failed to create SSE for job ${jobId}:`, error);
        startPolling(jobId);
      }
    },
    [updateJob, closeSSEConnection, startPolling]
  );

  // ============================================================================
  // PUBLIC API
  // ============================================================================

  /**
   * Check if user can start a new extraction
   * For now, allow only one in-progress extraction for free users
   * TODO: Integrate with premium/subscription status
   */
  const canStartNewExtraction = useCallback((): boolean => {
    const inProgressJobs = activeJobs.filter(
      (job) => job.status === ("pending" as ExtractionStatus) || job.status === ("processing" as ExtractionStatus)
    );
    // For now, allow only 1 concurrent extraction
    // TODO: Check isPremium from auth/subscription context
    const isPremium = true;
    return isPremium || inProgressJobs.length === 0;
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
  const minimizeJob = useCallback((jobId: string) => {
    updateJob(jobId, { isMinimized: true });
  }, [updateJob]);

  /**
   * Expand a job from the widget
   */
  const expandJob = useCallback((jobId: string) => {
    updateJob(jobId, { isMinimized: false });
  }, [updateJob]);

  /**
   * Dismiss/remove a job from tracking
   */
  const dismissJob = useCallback(
    (jobId: string) => {
      // Clean up connections
      closeSSEConnection(jobId);
      stopPolling(jobId);

      // Remove from active jobs
      setActiveJobs((prev) => prev.filter((job) => job.id !== jobId));
    },
    [closeSSEConnection, stopPolling]
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
    (job) => job.status === ("pending" as ExtractionStatus) || job.status === ("processing" as ExtractionStatus)
  ).length;

  // ============================================================================
  // CLEANUP
  // ============================================================================

  useEffect(() => {
    // Copy refs to local variables for cleanup
    const sseConnections = sseConnectionsRef.current;
    const pollingIntervals = pollingIntervalsRef.current;

    return () => {
      isUnmountedRef.current = true;

      // Clean up all SSE connections
      sseConnections.forEach((connection) => {
        connection.cleanup();
      });
      sseConnections.clear();

      // Clean up all polling intervals
      pollingIntervals.forEach((interval) => {
        clearInterval(interval);
      });
      pollingIntervals.clear();
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

  return (
    <ExtractionContext.Provider value={value}>
      {children}
    </ExtractionContext.Provider>
  );
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
