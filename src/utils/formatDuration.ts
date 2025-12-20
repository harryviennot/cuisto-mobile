/**
 * Format a duration in minutes to a human-readable string.
 *
 * Rules:
 * - Under 90 minutes: show in minutes (e.g., "45 min")
 * - 90 minutes to 24 hours: show in hours and minutes (e.g., "2h 30min")
 * - Over 24 hours: show in days and hours (e.g., "2 days 3h")
 */

interface DurationParts {
  days: number;
  hours: number;
  minutes: number;
}

export function getDurationParts(totalMinutes: number): DurationParts {
  const days = Math.floor(totalMinutes / (24 * 60));
  const remainingAfterDays = totalMinutes % (24 * 60);
  const hours = Math.floor(remainingAfterDays / 60);
  const minutes = remainingAfterDays % 60;

  return { days, hours, minutes };
}

interface FormatDurationOptions {
  /**
   * Translation function for localized strings.
   * If not provided, defaults to English abbreviations.
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  t?: (key: any, options?: any) => string;
}

/**
 * Formats minutes into a human-readable duration string.
 *
 * @param totalMinutes - The total duration in minutes
 * @param options - Optional configuration including translation function
 * @returns Formatted duration string
 *
 * @example
 * formatDuration(45) // "45 min"
 * formatDuration(90) // "1h 30min"
 * formatDuration(150) // "2h 30min"
 * formatDuration(1500) // "1 day 1h"
 * formatDuration(3000) // "2 days 2h"
 */
export function formatDuration(totalMinutes: number, options?: FormatDurationOptions): string {
  const { t } = options ?? {};

  if (totalMinutes <= 0) {
    return t ? `0 ${t("common.min")}` : "0 min";
  }

  const { days, hours, minutes } = getDurationParts(totalMinutes);

  // Helper to get localized unit strings
  const getMinLabel = () => (t ? t("common.min") : "min");
  const getHourLabel = () => (t ? t("common.hour") : "h");
  const getDayLabel = (count: number) => {
    if (t) {
      return t("common.day", { count });
    }
    return count === 1 ? "day" : "days";
  };

  // Over 24 hours: show days and hours
  if (days > 0) {
    const dayPart = `${days} ${getDayLabel(days)}`;
    if (hours > 0) {
      return `${dayPart} ${hours}${getHourLabel()}`;
    }
    return dayPart;
  }

  // 90 minutes to 24 hours: show hours and minutes
  if (totalMinutes >= 90) {
    if (minutes === 0) {
      return `${hours}${getHourLabel()}`;
    }
    return `${hours}${getHourLabel()} ${minutes}${getMinLabel()}`;
  }

  // Under 90 minutes: show just minutes
  return `${totalMinutes} ${getMinLabel()}`;
}
