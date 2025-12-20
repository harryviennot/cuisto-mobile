import "@/global.css";
import { View, Text, Pressable } from "react-native";
import { useRef, useEffect, useState, useCallback, memo } from "react";
import { useTranslation } from "react-i18next";
import { Minus, Plus } from "phosphor-react-native";
import { ShadowItem } from "@/components/ShadowedSection";
import { formatDuration } from "@/utils/formatDuration";

interface TimeAdjusterProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  originalValue?: number;
  min?: number; // Minimum value (default 0)
  max?: number; // Maximum value (default 10080 - 7 days)
  className?: string;
}

/**
 * Get dynamic increment based on current value:
 * - Under 3 hours (180 min): 1 minute increments
 * - 3-6 hours (180-360 min): 5 minute increments
 * - 6-12 hours (360-720 min): 15 minute increments
 * - Over 12 hours (720+ min): 60 minute (1 hour) increments
 */
function getDynamicIncrement(currentMinutes: number): number {
  if (currentMinutes < 180) return 1; // Under 3 hours: 1 min
  if (currentMinutes < 360) return 5; // 3-6 hours: 5 min
  if (currentMinutes < 720) return 15; // 6-12 hours: 15 min
  return 60; // Over 12 hours: 1 hour
}

export const TimeAdjuster = memo(function TimeAdjuster({
  label,
  value,
  onChange,
  originalValue,
  min = 0,
  max = 10080, // 7 days in minutes
  className = "",
}: TimeAdjusterProps) {
  const { t } = useTranslation();

  // Local display state for smooth visual updates
  const [displayValue, setDisplayValue] = useState(value);

  // Long press interval refs
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const delayTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingValueRef = useRef<number | null>(null);

  // Store latest values in refs to avoid stale closures
  const displayValueRef = useRef(displayValue);
  displayValueRef.current = displayValue;

  // Sync display value when prop changes from outside
  useEffect(() => {
    setDisplayValue(value);
  }, [value]);


  // Clear any running interval and delay timeout
  const clearAutoIncrement = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (delayTimeoutRef.current) {
      clearTimeout(delayTimeoutRef.current);
      delayTimeoutRef.current = null;
    }

    // Sync final value to parent ONCE when releasing
    if (pendingValueRef.current !== null) {
      onChange(pendingValueRef.current);
    }
    pendingValueRef.current = null;
  }, [onChange]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      clearAutoIncrement();
    };
  }, [clearAutoIncrement]);

  // Start auto-increment on long press with delay
  // direction: 1 for increment, -1 for decrement
  const startAutoIncrement = useCallback(
    (direction: 1 | -1) => {
      // Clear any existing timers first
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      if (delayTimeoutRef.current) {
        clearTimeout(delayTimeoutRef.current);
        delayTimeoutRef.current = null;
      }

      // Wait 200ms before starting auto-increment
      const timeout = setTimeout(() => {
        let internalValue = displayValueRef.current;

        // Start interval for smooth visual updates
        const interval = setInterval(() => {
          // Recalculate increment based on current value for dynamic stepping
          const dynamicIncrement = getDynamicIncrement(internalValue) * direction;
          internalValue = Math.min(max, Math.max(min, internalValue + dynamicIncrement));

          // Update display immediately for smooth animation
          setDisplayValue(internalValue);

          // Track pending value to sync on release
          pendingValueRef.current = internalValue;
        }, 60); // Update every 60ms for smooth visual feedback

        intervalRef.current = interval;
      }, 200); // 200ms delay before auto-increment starts

      delayTimeoutRef.current = timeout;
    },
    [min, max]
  );

  const handleIncrement = useCallback(() => {
    const increment = getDynamicIncrement(displayValueRef.current);
    const newValue = Math.min(max, displayValueRef.current + increment);
    setDisplayValue(newValue);
    onChange(newValue);
  }, [max, onChange]);

  const handleDecrement = useCallback(() => {
    const increment = getDynamicIncrement(displayValueRef.current);
    const newValue = Math.max(min, displayValueRef.current - increment);
    setDisplayValue(newValue);
    onChange(newValue);
  }, [min, onChange]);

  const handleStartIncrement = useCallback(() => startAutoIncrement(1), [startAutoIncrement]);
  const handleStartDecrement = useCallback(() => startAutoIncrement(-1), [startAutoIncrement]);

  const isModified = originalValue !== undefined && value !== originalValue;

  return (
    <View className={`flex-1 mb-6 ${className}`}>
      {/* Label with modified indicator */}
      <View className="flex-row items-center mb-3 gap-2">
        <Text className="text-sm font-bold uppercase tracking-widest text-foreground-tertiary">
          {label}
        </Text>
        {isModified && (
          <View className=" px-2 py-0.5 rounded-full">
            <Text className="text-state- text-xs font-semibold">
              {t("recipe.timeAdjuster.modified")}
            </Text>
          </View>
        )}
      </View>

      {/* Time Display with Controls */}
      <ShadowItem className="flex-row items-center justify-between rounded-xl p-4 mb-3">
        <Pressable
          onPress={handleDecrement}
          onPressIn={handleStartDecrement}
          onPressOut={clearAutoIncrement}
          onTouchEnd={clearAutoIncrement}
          className="h-10 w-10 items-center justify-center"
          hitSlop={10}
        >
          <Minus size={24} color="#3a3226" weight="bold" />
        </Pressable>

        <Text
          className="text-2xl text-foreground-heading"
          style={{ fontFamily: "PlayfairDisplay_700Bold" }}
        >
          {formatDuration(displayValue, { t })}
        </Text>

        <Pressable
          onPress={handleIncrement}
          onPressIn={handleStartIncrement}
          onPressOut={clearAutoIncrement}
          onTouchEnd={clearAutoIncrement}
          className="h-10 w-10 items-center justify-center"
          hitSlop={10}
        >
          <Plus size={24} color="#3a3226" weight="bold" />
        </Pressable>
      </ShadowItem>
    </View>
  );
});
