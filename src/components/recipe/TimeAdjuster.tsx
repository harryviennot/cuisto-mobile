import "@/global.css";
import { View, Text, Pressable } from "react-native";
import { useRef, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Minus, Plus } from "phosphor-react-native";
import { ShadowItem } from "../ShadowedSection";

interface Preset {
  label: string;
  minutes: number;
}

interface TimeAdjusterProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  originalValue?: number;
  increment?: number; // Amount to increment/decrement (default 5)
  min?: number; // Minimum value (default 0)
  max?: number; // Maximum value (default 1440 - 24 hours)
  className?: string;
}

export function TimeAdjuster({
  label,
  value,
  onChange,
  originalValue,
  increment = 1,
  min = 0,
  max = 1440,
  className = "",
}: TimeAdjusterProps) {
  const { t } = useTranslation();

  // Local display state for smooth visual updates
  const [displayValue, setDisplayValue] = useState(value);

  // Long press interval refs
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const delayTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pendingValueRef = useRef<number | null>(null);

  // Sync display value when prop changes from outside
  useEffect(() => {
    setDisplayValue(value);
  }, [value]);

  const formatTime = (totalMinutes: number) => {
    if (totalMinutes === 0) return "0m";
    const hours = Math.floor(totalMinutes / 60);
    const mins = totalMinutes % 60;

    if (hours === 0) return `${mins}m`;
    if (mins === 0) return `${hours}h`;
    return `${hours}h ${mins}m`;
  };

  // Clear any running interval and delay timeout
  const clearAutoIncrement = () => {
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
  };

  // Clean up on unmount
  useEffect(() => {
    return () => {
      clearAutoIncrement();
    };
  }, []);

  // Start auto-increment on long press with delay
  const startAutoIncrement = (incrementAmount: number) => {
    // Clear any existing timers first
    clearAutoIncrement();

    // Wait 200ms before starting auto-increment
    const timeout = setTimeout(() => {
      let internalValue = displayValue;

      // Start interval for smooth visual updates
      const interval = setInterval(() => {
        internalValue = Math.min(max, Math.max(min, internalValue + incrementAmount));

        // Update display immediately for smooth animation
        setDisplayValue(internalValue);

        // Track pending value to sync on release
        pendingValueRef.current = internalValue;
      }, 60); // Update every 30ms for smooth visual feedback

      intervalRef.current = interval as any;
    }, 200); // 200ms delay before auto-increment starts

    delayTimeoutRef.current = timeout as any;
  };

  const handleIncrement = () => {
    const newValue = Math.min(max, displayValue + increment);
    setDisplayValue(newValue);
    onChange(newValue);
  };

  const handleDecrement = () => {
    const newValue = Math.max(min, displayValue - increment);
    setDisplayValue(newValue);
    onChange(newValue);
  };

  const isModified = originalValue !== undefined && value !== originalValue;

  return (
    <View className={`flex-1 mb-6 ${className}`}>
      {/* Label with modified indicator */}
      <View className="flex-row items-center mb-3 gap-2">
        <Text className="text-sm font-bold uppercase tracking-widest text-foreground-tertiary">
          {label}
        </Text>
        {isModified && (
          <View className="bg-primary-main px-2 py-0.5 rounded-full">
            <Text className="text-white text-xs font-semibold">{t("recipe.timeAdjuster.modified")}</Text>
          </View>
        )}
      </View>

      {/* Time Display with Controls */}
      <ShadowItem className="flex-row items-center justify-between rounded-xl p-4 mb-3">
        <Pressable
          onPress={handleDecrement}
          onPressIn={() => startAutoIncrement(-increment)}
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
          {formatTime(displayValue)}
        </Text>

        <Pressable
          onPress={handleIncrement}
          onPressIn={() => startAutoIncrement(increment)}
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
}
