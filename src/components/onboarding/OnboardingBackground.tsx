/**
 * Onboarding background component
 * Blurred food imagery background (like CookingMode pattern)
 * Uses expo-image + expo-blur BlurView
 */
import React from "react";
import { View, StyleSheet } from "react-native";
import { Image } from "expo-image";
import { BlurView } from "expo-blur";

// Import onboarding background images
const ONBOARDING_IMAGES = [
  require("../../../assets/images/onboarding/onboarding1.jpg"),
  require("../../../assets/images/onboarding/onboarding2.jpg"),
  require("../../../assets/images/onboarding/onboarding3.jpg"),
  require("../../../assets/images/onboarding/onboarding4.jpg"),
  require("../../../assets/images/onboarding/onboarding5.jpg"),
];

interface OnboardingBackgroundProps {
  /** Step index (0-4) to determine which image to show */
  step: number;
  /** Blur intensity (default: 30) */
  blurIntensity?: number;
  /** Image opacity (default: 0.5) */
  imageOpacity?: number;
}

export function OnboardingBackground({
  step,
  blurIntensity = 30,
  imageOpacity = 0.4,
}: OnboardingBackgroundProps) {
  // Clamp step to valid range
  const imageIndex = Math.min(Math.max(step, 0), ONBOARDING_IMAGES.length - 1);
  const imageSource = ONBOARDING_IMAGES[imageIndex];

  return (
    <View style={[styles.container, { opacity: imageOpacity }]}>
      <Image
        source={imageSource}
        style={styles.image}
        contentFit="cover"
        transition={400}
      />
      <BlurView
        intensity={blurIntensity}
        tint="dark"
        style={styles.blur}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  image: {
    width: "100%",
    height: "100%",
  },
  blur: {
    position: "absolute",
    inset: 0,
  },
});
