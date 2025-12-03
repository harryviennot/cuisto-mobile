import React, { useEffect, useState } from "react";
import { View, Text, Pressable } from "react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withDelay,
  Easing,
  interpolate,
} from "react-native-reanimated";
import {
  ArrowRightIcon,
  GlobeIcon,
  MicrophoneIcon,
  CameraIcon,
  ClockIcon,
  FlameIcon,
  TiktokLogoIcon,
  InstagramLogoIcon,
  PlayIcon,
} from "phosphor-react-native";
import type { Icon } from "phosphor-react-native";
import type { ImageSource } from "expo-image";

import { ShowcaseItem } from "./ShowcaseItems";

interface SatelliteSourceProps {
  item: ShowcaseItem;
  isActive: boolean;
  index: number;
}

export const SatelliteSource = ({ item, isActive, index }: SatelliteSourceProps) => {
  const IconComponent = item.source.icon;

  const scale = useSharedValue(0.9);
  const opacity = useSharedValue(0.6);
  const labelWidth = useSharedValue(0);

  useEffect(() => {
    scale.value = withSpring(isActive ? 1.1 : 0.9, { damping: 20, stiffness: 150 });
    opacity.value = withTiming(isActive ? 1 : 0.6, { duration: 500 });
    labelWidth.value = withTiming(isActive ? 80 : 0, {
      duration: 500,
      easing: Easing.out(Easing.cubic),
    });
  }, [isActive]);

  const containerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const labelStyle = useAnimatedStyle(() => ({
    width: labelWidth.value,
    opacity: interpolate(labelWidth.value, [0, 80], [0, 1]),
  }));

  const positions = [
    { top: 10, left: -10 },
    { top: 48, right: -16 },
    { bottom: 90, right: -12 },
    { bottom: 25, left: -10 },
  ];

  const pos = positions[index];

  return (
    <Animated.View style={[containerStyle, { position: "absolute", zIndex: 30, ...pos }]}>
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
