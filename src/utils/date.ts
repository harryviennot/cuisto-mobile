/**
 * Date utility functions
 */

const MONTHS_SHORT = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
];

const WEEKDAYS = [
  "Sunday", "Monday", "Tuesday", "Wednesday",
  "Thursday", "Friday", "Saturday"
];

/**
 * Format a date with common patterns
 * @param date - Date object or date string
 * @param formatString - Format pattern:
 *   - "MMM d" -> "Jan 5"
 *   - "MMM d, yyyy" -> "Jan 5, 2024"
 *   - "EEEE, MMM d" -> "Monday, Jan 5"
 * @returns Formatted date string
 */
export function formatDate(date: Date | string, formatString: string): string {
  const dateObj = typeof date === "string" ? new Date(date) : date;

  const day = dateObj.getDate();
  const month = MONTHS_SHORT[dateObj.getMonth()];
  const year = dateObj.getFullYear();
  const weekday = WEEKDAYS[dateObj.getDay()];

  switch (formatString) {
    case "MMM d":
      return `${month} ${day}`;
    case "MMM d, yyyy":
      return `${month} ${day}, ${year}`;
    case "EEEE, MMM d":
      return `${weekday}, ${month} ${day}`;
    default:
      return `${month} ${day}, ${year}`;
  }
}
