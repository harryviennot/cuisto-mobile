/**
 * Cooking Session Context
 *
 * Manages active cooking sessions with timer tracking.
 * Persists session data to AsyncStorage for resilience across app restarts.
 *
 * Usage:
 * 1. Call startSession() when entering cooking mode
 * 2. Call endSession() when completing cooking to get duration
 * 3. The duration can then be passed to markRecipeAsCooked()
 */
import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import type { CookingSession } from "@/types/cookingHistory";
import {
  saveCookingSession,
  getCookingSession,
  clearCookingSession,
  calculateElapsedMinutes,
  formatElapsedTime,
} from "@/utils/cookingSession";

interface CookingSessionContextType {
  /** Current active cooking session, if any */
  activeSession: CookingSession | null;

  /** Whether a cooking session is currently active */
  isSessionActive: boolean;

  /** Start a new cooking session for a recipe */
  startSession: (recipeId: string, recipeTitle: string) => Promise<void>;

  /**
   * End the current cooking session
   * @returns The duration in minutes, or null if no session was active
   */
  endSession: () => Promise<number | null>;

  /** Cancel the current session without recording duration */
  cancelSession: () => Promise<void>;

  /** Get the elapsed time in minutes for the current session */
  getElapsedMinutes: () => number;

  /** Get formatted elapsed time (e.g., "25m" or "1h 15m") */
  getFormattedElapsedTime: () => string;
}

const CookingSessionContext = createContext<CookingSessionContextType | undefined>(undefined);

export function CookingSessionProvider({ children }: { children: React.ReactNode }) {
  const [activeSession, setActiveSession] = useState<CookingSession | null>(null);

  // Restore session from storage on mount
  useEffect(() => {
    const restoreSession = async () => {
      const session = await getCookingSession();
      if (session) {
        setActiveSession(session);
      }
    };
    restoreSession();
  }, []);

  const startSession = useCallback(async (recipeId: string, recipeTitle: string) => {
    const session: CookingSession = {
      recipeId,
      recipeTitle,
      startedAt: Date.now(),
    };

    setActiveSession(session);
    await saveCookingSession(session);
  }, []);

  const endSession = useCallback(async (): Promise<number | null> => {
    if (!activeSession) {
      return null;
    }

    const durationMinutes = calculateElapsedMinutes(activeSession.startedAt);

    // Clear the session
    setActiveSession(null);
    await clearCookingSession();

    return durationMinutes;
  }, [activeSession]);

  const cancelSession = useCallback(async () => {
    setActiveSession(null);
    await clearCookingSession();
  }, []);

  const getElapsedMinutes = useCallback(() => {
    if (!activeSession) return 0;
    return calculateElapsedMinutes(activeSession.startedAt);
  }, [activeSession]);

  const getFormattedElapsedTime = useCallback(() => {
    if (!activeSession) return "0m";
    return formatElapsedTime(activeSession.startedAt);
  }, [activeSession]);

  const value: CookingSessionContextType = {
    activeSession,
    isSessionActive: activeSession !== null,
    startSession,
    endSession,
    cancelSession,
    getElapsedMinutes,
    getFormattedElapsedTime,
  };

  return <CookingSessionContext.Provider value={value}>{children}</CookingSessionContext.Provider>;
}

/**
 * Hook to access the cooking session context
 */
export function useCookingSession() {
  const context = useContext(CookingSessionContext);
  if (context === undefined) {
    throw new Error("useCookingSession must be used within a CookingSessionProvider");
  }
  return context;
}
