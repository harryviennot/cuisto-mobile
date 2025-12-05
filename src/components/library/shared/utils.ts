/**
 * Library Shared Utilities
 *
 * Helper functions used across library components.
 */

/**
 * Get font size and position based on digit count for background number display.
 * Used in SmartCollectionCard for the large background count.
 */
export function getCountStyle(count: number = 0): { fontSize: number; top: number } {
  if (count > 999) return { fontSize: 65, top: 4 };
  if (count > 99) return { fontSize: 100, top: -12 };
  return { fontSize: 120, top: -16 };
}
