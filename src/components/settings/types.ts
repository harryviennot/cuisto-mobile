import React from "react";

export interface SettingsItem {
  id: string;
  icon: React.ReactNode;
  title: string;
  description?: string;
  onPress: () => void;
  variant?: "default" | "destructive";
  rightText?: string;
}
