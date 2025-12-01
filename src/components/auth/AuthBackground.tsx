import React from "react";
import { View, StyleSheet } from "react-native";
import { Image } from "expo-image";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";

interface AuthBackgroundProps {
  children: React.ReactNode;
}

/**
 * AuthBackground - Immersive dark background with blurred food imagery
 * Creates a premium, cinematic feel for authentication screens
 */
export const AuthBackground: React.FC<AuthBackgroundProps> = ({ children }) => {
  return (
    <View className="flex-1 bg-stone-950">
      {/* Background Image with Blur */}
      <View className="absolute inset-0 opacity-40">
        <Image
          source={require("../../../assets/images/onboarding/onboarding2.jpg")}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
        />
        <BlurView intensity={20} tint="dark" style={StyleSheet.absoluteFill} />
      </View>

      {/* Gradient Overlay */}
      <LinearGradient
        colors={["rgba(28, 25, 23, 0.3)", "rgba(28, 25, 23, 0.8)", "rgba(28, 25, 23, 1)"]}
        locations={[0, 0.5, 1]}
        style={StyleSheet.absoluteFill}
      />

      {/* Content */}
      {children}
    </View>
  );
};
