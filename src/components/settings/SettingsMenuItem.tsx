import React from "react";
import { View, Text, Pressable, Switch } from "react-native";
import { CaretRightIcon } from "phosphor-react-native";

import { SettingsItem } from "./types";

interface SettingsMenuItemProps {
  item: SettingsItem;
  isLast: boolean;
}

export function SettingsMenuItem({ item, isLast }: SettingsMenuItemProps) {
  const handlePress = () => {
    if (item.isToggle && item.onToggleChange) {
      item.onToggleChange(!item.toggleValue);
    } else {
      item.onPress();
    }
  };

  return (
    <Pressable
      onPress={handlePress}
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
          <Text className="text-sm text-foreground-muted mt-0.5" numberOfLines={2}>
            {item.description}
          </Text>
        )}
      </View>
      {item.isToggle ? (
        <Switch
          value={item.toggleValue}
          onValueChange={item.onToggleChange}
          trackColor={{ false: "#d4c4b0", true: "#b89a6a" }}
          thumbColor={item.toggleValue ? "#ffffff" : "#ffffff"}
          ios_backgroundColor="#d4c4b0"
        />
      ) : (
        <CaretRightIcon size={20} color="#9a8b7a" />
      )}
    </Pressable>
  );
}
