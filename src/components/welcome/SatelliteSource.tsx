import React, { useEffect, useState } from "react";
import { View, Text, LayoutChangeEvent } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  Easing,
} from "react-native-reanimated";

import { ShowcaseItem } from "./ShowcaseItems";

interface SatelliteSourceProps {
  item: ShowcaseItem;
  isActive: boolean;
  index: number;
  scale?: number;
}

// Base positions for satellites (designed for scale = 1)
// Positive values keep satellites within the container bounds
const BASE_POSITIONS = [
  { top: 10, left: 12 },
  { top: 48, right: 12 },
  { bottom: 90, right: 12 },
  { bottom: 25, left: 12 },
];

export const SatelliteSource = ({
  item,
  isActive,
  index,
  scale: sizeScale = 1,
}: SatelliteSourceProps) => {
  const IconComponent = item.source.icon;
  const [textWidth, setTextWidth] = useState(0);

  const animScale = useSharedValue(0.9);
  const opacity = useSharedValue(0.6);
  const labelWidth = useSharedValue(0);

  // Measure text width when it changes
  const onTextLayout = (event: LayoutChangeEvent) => {
    const { width } = event.nativeEvent.layout;
    setTextWidth(width);
  };

  useEffect(() => {
    animScale.value = withSpring(isActive ? 1.1 : 0.9, { damping: 20, stiffness: 150 });
    opacity.value = withTiming(isActive ? 1 : 0.6, { duration: 500 });
    // Animate to actual text width (with padding) when active, 0 when inactive
    const targetWidth = isActive && textWidth > 0 ? textWidth + 8 : 0; // +8 for pl-2 padding
    labelWidth.value = withTiming(targetWidth, {
      duration: 500,
      easing: Easing.out(Easing.cubic),
    });
  }, [isActive, animScale, opacity, labelWidth, textWidth]);

  const containerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: animScale.value }],
    opacity: opacity.value,
  }));

  // Animate width as a clipping container - text inside will be revealed gradually
  const labelStyle = useAnimatedStyle(() => ({
    width: labelWidth.value,
  }));

  // Scale positions based on the size scale
  const basePos = BASE_POSITIONS[index];
  const pos: Record<string, number> = {};
  for (const [key, value] of Object.entries(basePos)) {
    if (value !== undefined) {
      pos[key] = value * sizeScale;
    }
  }

  return (
    <Animated.View style={[containerStyle, { position: "absolute", zIndex: 30, ...pos }]}>
      {/* Hidden text to measure actual width */}
      <Text
        onLayout={onTextLayout}
        className="text-[10px] font-bold uppercase tracking-wider absolute opacity-0"
        style={{ position: "absolute", opacity: 0 }}
      >
        {item.source.name}
      </Text>

      <View
        className={`flex-row items-center p-2.5 rounded-2xl shadow-lg border transition-colors duration-500 ${isActive ? "bg-white border-stone-200" : "bg-white/60 border-white/40"}`}
      >
        <LinearGradient
          colors={isActive ? item.source.colors : ["#d6d3d1", "#a8a29e"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            height: 24,
            width: 24,
            borderRadius: 6,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <IconComponent size={16} color="white" weight="fill" />
        </LinearGradient>

        <Animated.View style={[labelStyle, { overflow: "hidden" }]}>
          <Text
            className="pl-2 text-[10px] font-bold uppercase tracking-wider text-stone-600 whitespace-nowrap"
            numberOfLines={1}
          >
            {item.source.name}
          </Text>
        </Animated.View>
      </View>
    </Animated.View>
  );
};
