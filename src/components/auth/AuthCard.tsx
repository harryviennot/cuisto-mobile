import React from "react";
import { View, ViewProps, StyleSheet } from "react-native";
import { BlurView } from "expo-blur";
import { cn } from "@/utils/cn";

interface AuthCardProps extends ViewProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * AuthCard - Glassmorphic card container for auth forms
 * Features backdrop blur, subtle border, and premium styling
 */
export const AuthCard: React.FC<AuthCardProps> = ({ children, className, style, ...props }) => {
  return (
    <View
      className={cn("overflow-hidden rounded-[32px] border border-white/10", className)}
      style={style}
      {...props}
    >
      <BlurView intensity={40} tint="dark" style={StyleSheet.absoluteFill} />
      <View className="bg-white/5 p-8">{children}</View>
    </View>
  );
};
