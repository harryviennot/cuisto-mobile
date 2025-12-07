import React from "react";
import { View, Text } from "react-native";

import { SettingsItem } from "./types";
import { SettingsMenuItem } from "./SettingsMenuItem";

interface SettingsSectionProps {
  title: string;
  items: SettingsItem[];
  variant?: "default" | "danger";
}

export function SettingsSection({
  title,
  items,
  variant = "default",
}: SettingsSectionProps) {
  const isDanger = variant === "danger";

  return (
    <View className="mb-6">
      <Text
        className={`px-5 py-2 text-xs font-bold uppercase tracking-wider ${
          isDanger ? "text-state-error" : "text-foreground-tertiary"
        }`}
      >
        {title}
      </Text>
      <View
        className={`bg-surface rounded-2xl mx-4 overflow-hidden shadow-sm ${
          isDanger ? "border border-state-error/20" : "border border-border-light"
        }`}
      >
        {items.map((item, index) => (
          <SettingsMenuItem
            key={item.id}
            item={item}
            isLast={index === items.length - 1}
          />
        ))}
      </View>
    </View>
  );
}
