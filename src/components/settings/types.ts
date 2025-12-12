import React from "react";

export interface SettingsItem {
  id: string;
  icon: React.ReactNode;
  title: string;
  description?: string;
  onPress: () => void;
  variant?: "default" | "destructive";
  rightText?: string;
  /** If true, renders as a toggle switch instead of a navigation item */
  isToggle?: boolean;
  /** Current value for toggle items */
  toggleValue?: boolean;
  /** Callback for toggle items */
  onToggleChange?: (value: boolean) => void;
}
