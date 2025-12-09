/**
 * useExtractionJob Hook
 *
 * Manages extraction job monitoring with SSE (Server-Sent Events) and polling fallback.
 * Automatically switches to SSE when available, falls back to polling on error.
 *
 * @example
 * const { job, error, isConnected } = useExtractionJob({
 *   jobId: 'abc-123',
 *   onComplete: (job) => console.log('Extraction complete!'),
 * });
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { extractionService } from "@/api/services/extraction.service";
import { supabase } from "@/lib/supabase";
import { API_URL } from "@/api/api-client";
import { useSSE, isSSESupported } from "./useSSE";
import { usePolling } from "./usePolling";
import { ExtractionStatus, type ExtractionJob } from "@/types/extraction";

interface UseExtractionJobConfig {
  jobId: string;
  onComplete?: (job: ExtractionJob) => void;
  onError?: (error: Error) => void;
  enableSSE?: boolean; // Feature flag for SSE (default: false until fully tested)
}

interface UseExtractionJobReturn {
  job: ExtractionJob | null;
  error: Error | null;
  isConnected: boolean;
  connectionType: "sse" | "polling" | "none";
  retry: () => void;
}

/**
 * Hook for monitoring extraction job progress with SSE and polling fallback
 */
export function useExtractionJob(config: UseExtractionJobConfig): UseExtractionJobReturn {
  const { jobId, onComplete, onError, enableSSE = true } = config;

  const [job, setJob] = useState<ExtractionJob | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [connectionType, setConnectionType] = useState<"sse" | "polling" | "none">("none");
  const [usePollingFallback, setUsePollingFallback] = useState(false);
  const [token, setToken] = useState<string | null>(null);

  const hasCompletedRef = useRef(false);

  // Load auth token from Supabase session
  useEffect(() => {
    const loadToken = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setToken(session?.access_token ?? null);
    };
    loadToken();
  }, []);

  // Check if job is complete (includes duplicate status)
  const isJobComplete = useCallback((jobData: ExtractionJob | null): boolean => {
    if (!jobData) return false;
    return (
      jobData.status === ExtractionStatus.COMPLETED ||
      jobData.status === ExtractionStatus.FAILED ||
      jobData.status === ExtractionStatus.DUPLICATE
    );
  }, []);

  // Handle job completion
  const handleComplete = useCallback(
    (jobData: ExtractionJob) => {
      if (!hasCompletedRef.current && isJobComplete(jobData)) {
        hasCompletedRef.current = true;
        onComplete?.(jobData);
      }
    },
    [isJobComplete, onComplete]
  );

  // Handle job updates
  const handleUpdate = useCallback(
    (jobData: ExtractionJob) => {
      setJob(jobData);
      setError(null);

      if (isJobComplete(jobData)) {
        handleComplete(jobData);
      }
    },
    [isJobComplete, handleComplete]
  );

  // SSE connection
  const {
    data: sseJob,
    error: sseError,
    isConnected: sseConnected,
  } = useSSE<ExtractionJob>({
    url: `${API_URL}/api/v1/extraction/jobs/${jobId}/stream`,
    token: token || undefined,
    onMessage: handleUpdate,
    onComplete: handleComplete,
    onError: (err) => {
      console.warn("[useExtractionJob] SSE error, falling back to polling:", err);
      setUsePollingFallback(true);
      onError?.(err);
    },
    shouldReconnect: (err) => {
      // Don't reconnect on auth errors or if job is complete
      if (err.message.includes("403") || err.message.includes("401")) {
        return false;
      }
      return !hasCompletedRef.current;
    },
    maxReconnectAttempts: 3,
  });

  // Polling fallback
  const {
    data: pollingJob,
    error: pollingError,
    startPolling,
  } = usePolling({
    fn: async () => {
      if (!jobId) throw new Error("Job ID is required");
      return await extractionService.getJob(jobId);
    },
    shouldStopPolling: isJobComplete,
    interval: 2000,
    enabled: usePollingFallback && !!jobId,
    maxConsecutiveErrors: 10,
    errorRetryDelay: 3000,
    onComplete: handleComplete,
    onError: (err) => {
      console.error("[useExtractionJob] Polling error:", err);
      setError(err as Error);
      onError?.(err as Error);
    },
  });

  // Determine connection type and active data source
  useEffect(() => {
    const sseSupported = isSSESupported();
    const sseEnabled = enableSSE && token && !usePollingFallback;

    if (sseEnabled && sseSupported) {
      setConnectionType("sse");
      if (sseJob) {
        handleUpdate(sseJob);
      }
    } else if (usePollingFallback || !sseSupported || !enableSSE) {
      setConnectionType("polling");
      if (pollingJob) {
        handleUpdate(pollingJob);
      }
    } else {
      setConnectionType("none");
    }
  }, [enableSSE, token, usePollingFallback, sseJob, pollingJob, handleUpdate]);

  // Set error state
  useEffect(() => {
    if (connectionType === "sse" && sseError) {
      setError(sseError);
    } else if (connectionType === "polling" && pollingError) {
      setError(pollingError);
    }
  }, [connectionType, sseError, pollingError]);

  // Retry function
  const retry = useCallback(() => {
    hasCompletedRef.current = false;
    setError(null);

    if (connectionType === "polling") {
      startPolling();
    } else {
      // SSE will auto-reconnect, or force polling
      setUsePollingFallback(true);
    }
  }, [connectionType, startPolling]);

  return {
    job,
    error,
    isConnected: connectionType === "sse" ? sseConnected : connectionType === "polling",
    connectionType,
    retry,
  };
}
