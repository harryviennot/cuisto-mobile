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

/**
 * Section data structure for SectionList
 */
export interface CookingHistorySection {
  title: string;
  data: any[];
}

/**
 * Groups cooking history events by month and year for SectionList
 */
export function groupEventsToSections(events: any[]): CookingHistorySection[] {
  const sections: CookingHistorySection[] = [];
  let currentSection: CookingHistorySection | null = null;

  events.forEach((event) => {
    const date = new Date(event.cooked_at);
    const monthYear = date.toLocaleDateString(i18n.language, {
      month: "long",
      year: "numeric",
    }).toUpperCase();

    if (!currentSection || currentSection.title !== monthYear) {
      currentSection = { title: monthYear, data: [] };
      sections.push(currentSection);
    }

    currentSection.data.push(event);
  });

  return sections;
}

export type HistoryItemType =
  | { type: "header"; label: string; id: string }
  | { type: "event"; data: any; id: string };

/**
 * Groups cooking history events by month and year
 * Returns a flat array of headers and events suitable for FlatList/SectionList
 */
export function groupEventsByMonth(events: any[]): HistoryItemType[] {
  const groups: { [key: string]: any[] } = {};

  // Group by "Month Year"
  events.forEach((event) => {
    const date = new Date(event.cooked_at);
    // Use user's locale for month name, or hardcode to English if preferred "NOVEMBER 2025" style
    const monthYear = date.toLocaleDateString(i18n.language, {
      month: "long",
      year: "numeric",
    }).toUpperCase();

    if (!groups[monthYear]) {
      groups[monthYear] = [];
    }
    groups[monthYear].push(event);
  });

  // Flatten into array
  const result: HistoryItemType[] = [];

  // Sort months descending? Assuming events are already sorted by date desc
  // Just iterate keys naturally if they maintain order, or rely on event order.
  // Since events come sorted, we can likely trust the order of creation of keys 
  // or just use the first event of a month to decide order.
  // Actually, keeping strict order:
  let currentMonth = "";

  events.forEach(event => {
    const date = new Date(event.cooked_at);
    const monthYear = date.toLocaleDateString(i18n.language, {
      month: "long",
      year: "numeric"
    }).toUpperCase();

    if (monthYear !== currentMonth) {
      currentMonth = monthYear;
      result.push({ type: "header", label: currentMonth, id: `header-${currentMonth}` });
    }

    result.push({ type: "event", data: event, id: event.event_id });
  });

  return result;
}
