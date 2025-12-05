/**
 * Cooking History Utilities
 *
 * Helper functions for formatting and displaying cooking history data.
 */
import i18n from "@/locales/i18n";

/**
 * Format a date string to a relative date (e.g., "Today", "Yesterday", "3 days ago")
 * Falls back to absolute format for older dates (e.g., "Dec 5, 2025")
 */
export function formatRelativeDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();

  // Reset time components for accurate day comparison
  const dateDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const diffTime = today.getTime() - dateDay.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return i18n.t("cookingHistory.today");
  }

  if (diffDays === 1) {
    return i18n.t("cookingHistory.yesterday");
  }

  if (diffDays < 7) {
    return i18n.t("cookingHistory.daysAgo", { count: diffDays });
  }

  // For older dates, use absolute format
  return date.toLocaleDateString(i18n.language, {
    month: "short",
    day: "numeric",
    year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
  });
}

/**
 * Format duration in minutes to a human-readable string
 */
export function formatDuration(minutes: number): string {
  if (minutes < 60) {
    return i18n.t("cookingHistory.duration", { minutes });
  }

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  if (remainingMinutes === 0) {
    return `${hours}h`;
  }

  return `${hours}h ${remainingMinutes}m`;
}
