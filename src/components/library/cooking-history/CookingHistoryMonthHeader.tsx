import React from "react";
import { View, Text } from "react-native";

interface CookingHistoryMonthHeaderProps {
  label: string;
}

export function CookingHistoryMonthHeader({ label }: CookingHistoryMonthHeaderProps) {
  return (
    <View className="bg-surface px-6 py-3 border-b border-border-light">
      <Text className="text-xs font-bold text-foreground-tertiary uppercase tracking-widest">
        {label}
      </Text>
    </View>
  );
}
