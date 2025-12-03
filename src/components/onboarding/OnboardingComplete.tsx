/**
 * Onboarding completion screen
 * Welcome message with user's display name
 * Pulsing subtitle during submission
 * Animated entrance
 */
import React, { useEffect } from "react";
import { View } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withRepeat,
  withSequence,
  Easing,
} from "react-native-reanimated";
import { ChefHat } from "phosphor-react-native";
import { useTranslation } from "react-i18next";

interface OnboardingCompleteProps {
  displayName?: string;
}

export function OnboardingComplete({ displayName }: OnboardingCompleteProps) {
  const { t } = useTranslation();

  // Animation values
  const iconScale = useSharedValue(0);
  const iconOpacity = useSharedValue(0);
  const titleOpacity = useSharedValue(0);
  const titleTranslateY = useSharedValue(20);
  const subtitleOpacity = useSharedValue(0);

  useEffect(() => {
    // Staggered entrance animation
    iconScale.value = withDelay(
      100,
      withTiming(1, { duration: 500, easing: Easing.out(Easing.back(1.5)) })
    );
    iconOpacity.value = withDelay(100, withTiming(1, { duration: 400 }));

    titleOpacity.value = withDelay(400, withTiming(1, { duration: 500 }));
    titleTranslateY.value = withDelay(
      400,
      withTiming(0, { duration: 500, easing: Easing.out(Easing.cubic) })
    );

    // Start subtitle with entrance, then pulse
    subtitleOpacity.value = withDelay(
      700,
      withTiming(1, { duration: 400 }, () => {
        // After entrance, start pulsing
        subtitleOpacity.value = withRepeat(
          withSequence(
            withTiming(0.4, { duration: 800, easing: Easing.inOut(Easing.ease) }),
            withTiming(1, { duration: 800, easing: Easing.inOut(Easing.ease) })
          ),
          -1, // Repeat forever
          false
        );
      })
    );
  }, [iconScale, iconOpacity, titleOpacity, titleTranslateY, subtitleOpacity]);

  const iconAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: iconScale.value }],
    opacity: iconOpacity.value,
  }));

  const titleAnimatedStyle = useAnimatedStyle(() => ({
    opacity: titleOpacity.value,
    transform: [{ translateY: titleTranslateY.value }],
  }));

  const subtitleAnimatedStyle = useAnimatedStyle(() => ({
    opacity: subtitleOpacity.value,
  }));

  // Get first name or fallback
  const firstName = displayName?.split(" ")[0] || t("common.welcome");

  return (
    <View className="flex-1 items-center justify-center px-8">
      {/* Icon with glow effect */}
      <Animated.View style={iconAnimatedStyle} className="mb-8">
        <View className="relative">
          {/* Glow */}
          <View className="absolute -inset-4 rounded-full bg-primary/20 blur-xl" />
          {/* Icon container */}
          <View className="h-24 w-24 items-center justify-center rounded-full border border-white/20 bg-white/10">
            <ChefHat size={48} weight="duotone" color="#ffffff" />
          </View>
        </View>
      </Animated.View>

      {/* Welcome title */}
      <Animated.Text
        style={[titleAnimatedStyle, { fontFamily: "PlayfairDisplay_700Bold" }]}
        className="mb-4 text-center text-4xl text-white"
      >
        {t("onboarding.completion.title", { name: firstName })}
      </Animated.Text>

      {/* Pulsing subtitle */}
      <Animated.Text
        style={subtitleAnimatedStyle}
        className="text-center text-sm font-medium uppercase tracking-widest text-white/70"
      >
        {t("onboarding.completion.subtitle")}
      </Animated.Text>
    </View>
  );
}
