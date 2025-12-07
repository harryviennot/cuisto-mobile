import React from "react";
import { View, Text, Pressable } from "react-native";
import { CaretRightIcon } from "phosphor-react-native";

import { SettingsItem } from "./types";

interface SettingsMenuItemProps {
  item: SettingsItem;
  isLast: boolean;
}

export function SettingsMenuItem({ item, isLast }: SettingsMenuItemProps) {
  return (
    <Pressable
      onPress={item.onPress}
      className={`flex-row items-center px-5 py-4 active:bg-surface-elevated ${
        !isLast ? "border-b border-border-light" : ""
      }`}
    >
      <View
        className={`w-10 h-10 items-center justify-center bg-primary rounded-xl ${
          item.variant === "destructive" ? "bg-state-error" : ""
        }`}
      >
        {item.icon}
      </View>
      <View className="flex-1 ml-4">
        <Text
          className={`text-base font-medium ${
            item.variant === "destructive" ? "text-state-error" : "text-foreground-heading"
          }`}
        >
          {item.title}
        </Text>
        {item.description && (
          <Text className="text-sm text-foreground-muted mt-0.5" numberOfLines={1}>
            {item.description}
          </Text>
        )}
      </View>
      <CaretRightIcon size={20} color="#9a8b7a" />
    </Pressable>
  );
}
