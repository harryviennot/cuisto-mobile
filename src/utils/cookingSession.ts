/**
 * Cooking Session Persistence Utilities
 *
 * Uses AsyncStorage to persist active cooking sessions across app restarts.
 * This allows us to track cooking duration even if the app is killed.
 */
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { CookingSession } from "@/types/cookingHistory";

const STORAGE_KEY = "active_cooking_session";

/**
 * Save an active cooking session to storage
 */
export async function saveCookingSession(session: CookingSession): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  } catch (error) {
    console.error("Failed to save cooking session:", error);
  }
}

/**
 * Get the current active cooking session from storage
 */
export async function getCookingSession(): Promise<CookingSession | null> {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEY);
    if (!data) return null;
    return JSON.parse(data) as CookingSession;
  } catch (error) {
    console.error("Failed to get cooking session:", error);
    return null;
  }
}

/**
 * Clear the active cooking session from storage
 */
export async function clearCookingSession(): Promise<void> {
  try {
    await AsyncStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error("Failed to clear cooking session:", error);
  }
}

/**
 * Calculate elapsed time in minutes from a session start time
 * Returns at least 1 minute if any time has elapsed
 */
export function calculateElapsedMinutes(startedAt: number): number {
  const now = Date.now();
  const elapsedMs = now - startedAt;
  const minutes = Math.round(elapsedMs / 60000);
  // Return at least 1 minute if any time has elapsed (even a few seconds)
  return elapsedMs > 0 && minutes === 0 ? 1 : minutes;
}

/**
 * Format elapsed time for display
 */
export function formatElapsedTime(startedAt: number): string {
  const totalMinutes = calculateElapsedMinutes(startedAt);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
}
