/**
 * View Toggle Component
 *
 * Segmented control for switching between Grid and List views.
 */
import React from "react";
import { View, Pressable } from "react-native";
import { SquaresFour, List } from "phosphor-react-native";
import * as Haptics from "expo-haptics";

export type ViewMode = "grid" | "list";

export interface ViewToggleProps {
  /** Current view mode */
  value: ViewMode;
  /** Callback when view mode changes */
  onChange: (mode: ViewMode) => void;
}

export function ViewToggle({ value, onChange }: ViewToggleProps) {
  const handlePress = (mode: ViewMode) => {
    if (mode !== value) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onChange(mode);
    }
  };

  return (
    <View className="flex-row bg-stone-100 rounded-lg p-0.5">
      {/* Grid Button */}
      <Pressable
        onPress={() => handlePress("grid")}
        className={`px-2.5 py-1.5 rounded-md ${
          value === "grid" ? "bg-white shadow-sm" : ""
        }`}
        accessibilityRole="button"
        accessibilityLabel="Grid view"
        accessibilityState={{ selected: value === "grid" }}
      >
        <SquaresFour
          size={18}
          weight={value === "grid" ? "fill" : "regular"}
          color={value === "grid" ? "#334d43" : "#78716c"}
        />
      </Pressable>

      {/* List Button */}
      <Pressable
        onPress={() => handlePress("list")}
        className={`px-2.5 py-1.5 rounded-md ${
          value === "list" ? "bg-white shadow-sm" : ""
        }`}
        accessibilityRole="button"
        accessibilityLabel="List view"
        accessibilityState={{ selected: value === "list" }}
      >
        <List
          size={18}
          weight={value === "list" ? "fill" : "regular"}
          color={value === "list" ? "#334d43" : "#78716c"}
        />
      </Pressable>
    </View>
  );
}
