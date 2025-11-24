import "@/global.css";
import { View, Text, Pressable } from "react-native";
import { useRef, useEffect } from "react";
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
  increment = 5,
  min = 0,
  max = 1440,
  className = "",
}: TimeAdjusterProps) {
  // Long press interval refs
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const delayTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const currentValueRef = useRef(value);

  // Keep ref in sync with value
  currentValueRef.current = value;

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
  };

  // Clean up on unmount
  useEffect(() => {
    return () => {
      clearAutoIncrement();
    };
  }, []);

  // Start auto-increment on long press with 500ms delay
  const startAutoIncrement = (incrementAmount: number) => {
    // Clear any existing timers first
    clearAutoIncrement();

    // Wait 500ms before starting auto-increment
    const timeout = setTimeout(() => {
      // Start interval for continued changes
      const interval = setInterval(() => {
        const newValue = Math.min(max, Math.max(min, currentValueRef.current + incrementAmount));
        onChange(newValue);
      }, 100); // Repeat every 100ms

      intervalRef.current = interval as any;
    }, 500); // 500ms delay before auto-increment starts

    delayTimeoutRef.current = timeout as any;
  };

  const handleIncrement = () => {
    const newValue = Math.min(max, value + increment);
    onChange(newValue);
  };

  const handleDecrement = () => {
    const newValue = Math.max(min, value - increment);
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
            <Text className="text-white text-xs font-semibold">Modified</Text>
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
          {formatTime(value)}
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
