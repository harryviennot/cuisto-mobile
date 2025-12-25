/**
 * Premium Success Screen Component
 *
 * Celebration screen shown after successful premium purchase.
 * Features confetti animation built with react-native-reanimated.
 */
import React, { useEffect, useMemo, useState } from "react";
import { View, Text, Pressable, Linking, Dimensions, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import Animated, {
  FadeInDown,
  FadeIn,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
  withDelay,
  Easing,
  interpolate,
  cancelAnimation,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import {
  CrownIcon,
  EnvelopeSimpleIcon,
  ArrowRightIcon,
  ArrowsClockwiseIcon,
} from "phosphor-react-native";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

// Confetti colors matching Cuisto brand
const CONFETTI_COLORS = [
  "#334d43", // Forest green
  "#b8942d", // Premium gold
  "#d4b044", // Light gold
  "#507768", // Forest light
  "#f4f1e8", // Warm beige
  "#c9a962", // Gold accent
];

interface ConfettiPieceProps {
  index: number;
  side: "left" | "right";
  trigger: number;
}

function ConfettiPiece({ index, side, trigger }: ConfettiPieceProps) {
  const progress = useSharedValue(0);

  // Randomize properties for each piece - depends on trigger to regenerate
  const config = useMemo(() => {
    const color = CONFETTI_COLORS[index % CONFETTI_COLORS.length];
    const size = 8 + Math.random() * 8;
    const startX = side === "left" ? -20 : SCREEN_WIDTH + 20;
    const startY = SCREEN_HEIGHT * 0.4 + Math.random() * 100;
    const duration = 2500 + Math.random() * 1000;
    const delay = index * 25; // Staggered start

    // Physics parameters for realistic motion
    const initialVelocityY = -(250 + Math.random() * 150); // Upward launch speed
    const initialVelocityX = (side === "left" ? 1 : -1) * (100 + Math.random() * 200);
    const gravity = 500 + Math.random() * 200; // Fall acceleration
    const rotationSpeed = (Math.random() - 0.5) * 720; // Spin rate

    return {
      color,
      size,
      startX,
      startY,
      duration,
      delay,
      initialVelocityY,
      initialVelocityX,
      gravity,
      rotationSpeed,
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index, side, trigger]);

  useEffect(() => {
    // Reset and start animation
    progress.value = 0;
    progress.value = withDelay(
      config.delay,
      withTiming(1, { duration: config.duration, easing: Easing.out(Easing.quad) })
    );
    return () => {
      cancelAnimation(progress);
    };
  }, [config, progress]);

  const animatedStyle = useAnimatedStyle(() => {
    const t = progress.value;
    const elapsed = t * (config.duration / 1000); // Time in seconds

    // Horizontal: initial velocity with decay
    const translateX = config.startX + config.initialVelocityX * elapsed * 0.6;

    // Vertical: true parabolic motion (y = v₀t + ½gt²)
    const translateY =
      config.startY + config.initialVelocityY * elapsed + 0.5 * config.gravity * elapsed * elapsed;

    // Rotation with continuous spin
    const rotate = config.rotationSpeed * elapsed;

    // Fade out at the end
    const opacity = interpolate(t, [0, 0.05, 0.75, 1], [0, 1, 1, 0]);

    // Scale: start small, grow, then shrink
    const scale = interpolate(t, [0, 0.1, 0.5, 1], [0.3, 1, 1, 0.5]);

    return {
      transform: [{ translateX }, { translateY }, { rotate: `${rotate}deg` }, { scale }],
      opacity,
    };
  });

  // Randomize shape: square, circle, or rectangle
  const shapeStyle = useMemo(() => {
    const shapes = ["square", "circle", "rectangle"] as const;
    // Use index + trigger to maybe randomize shape too? Keep it consistent for now or random?
    // Let's keep consistent with index to avoid unnecessary style object recreation if we want,
    // but config.size changes with trigger so this must change too.
    const shape = shapes[index % 3];

    if (shape === "circle") {
      return { borderRadius: config.size / 2 };
    } else if (shape === "rectangle") {
      return { width: config.size * 0.5, height: config.size * 1.5, borderRadius: 2 };
    }
    return { borderRadius: 2 };
  }, [index, config.size]);

  return (
    <Animated.View
      style={[
        styles.confettiPiece,
        {
          width: config.size,
          height: config.size,
          backgroundColor: config.color,
        },
        shapeStyle,
        animatedStyle,
      ]}
    />
  );
}

interface ConfettiCannonProps {
  particleCount?: number;
  trigger: number;
}

function ConfettiCannon({ particleCount = 40, trigger }: ConfettiCannonProps) {
  const pieces = useMemo(() => {
    const result = [];
    for (let i = 0; i < particleCount; i++) {
      result.push(
        <ConfettiPiece key={`left-${i}`} index={i} side="left" trigger={trigger} />,
        <ConfettiPiece key={`right-${i}`} index={i} side="right" trigger={trigger} />
      );
    }
    return result;
  }, [particleCount, trigger]);

  return (
    <View style={styles.confettiContainer} pointerEvents="none">
      {pieces}
    </View>
  );
}

interface PremiumSuccessScreenProps {
  onContinue: () => void;
}

export function PremiumSuccessScreen({ onContinue }: PremiumSuccessScreenProps) {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const [confettiKey, setConfettiKey] = useState(0);

  // Pulsing crown animation
  const crownScale = useSharedValue(1);

  useEffect(() => {
    // Trigger haptic on mount
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    // Pulsing animation for crown
    crownScale.value = withRepeat(
      withSequence(withTiming(1.08, { duration: 1000 }), withTiming(1, { duration: 1000 })),
      -1,
      true
    );
    return () => {
      cancelAnimation(crownScale);
    };
  }, [crownScale]);

  const crownStyle = useAnimatedStyle(() => ({
    transform: [{ scale: crownScale.value }],
  }));

  const handleEmailPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Linking.openURL("mailto:harry@cuisto.app?subject=Cuisto%20Feedback");
  };

  const handleContinue = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onContinue();
  };

  return (
    <View className="flex-1 bg-surface">
      {/* Confetti Layer - Optimized count & reuse views */}
      <ConfettiCannon trigger={confettiKey} particleCount={50} />

      {/* DEV: Replay button */}
      {__DEV__ && (
        <Pressable
          onPress={() => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            setConfettiKey((k) => k + 1);
          }}
          className="absolute top-14 right-5 z-20 bg-purple-500 w-10 h-10 rounded-full items-center justify-center"
        >
          <ArrowsClockwiseIcon size={20} color="#ffffff" weight="bold" />
        </Pressable>
      )}

      {/* Content */}
      <Animated.View
        entering={FadeIn.duration(500)}
        className="flex-1 items-center justify-center px-8"
      >
        {/* Crown Icon with Glow */}
        <Animated.View
          entering={FadeInDown.delay(200).duration(600).springify()}
          style={crownStyle}
          className="relative mb-8"
        >
          {/* Glow effect - simplified using opacity layers */}
          <View className="absolute -inset-4 bg-premium/20 rounded-full" />
          <View className="absolute -inset-2 bg-premium/30 rounded-full" />
          <View className="w-24 h-24 bg-premium rounded-full items-center justify-center shadow-lg">
            <CrownIcon size={48} color="#ffffff" weight="fill" />
          </View>
        </Animated.View>

        {/* Welcome Text */}
        <Animated.View entering={FadeInDown.delay(400).duration(600)} className="items-center mb-6">
          <Text
            className="font-serif text-4xl text-stone-800 text-center mb-1"
            style={{ fontFamily: "PlayfairDisplay_400Regular" }}
          >
            {t("paywall.success.headline")}
          </Text>
          <Text
            className="font-serif text-4xl text-premium text-center"
            style={{ fontFamily: "PlayfairDisplay_400Regular_Italic" }}
          >
            Premium!
          </Text>
        </Animated.View>

        {/* Thank You Message */}
        <Animated.View
          entering={FadeInDown.delay(600).duration(600)}
          className="items-center mb-10"
        >
          <Text className="text-stone-600 text-base text-center leading-6 px-4">
            {t("paywall.success.thankYou")}
          </Text>
        </Animated.View>

        {/* Feedback Card */}
        <Animated.View
          entering={FadeInDown.delay(800).duration(600).springify()}
          className="w-full bg-surface-elevated rounded-2xl p-5 border border-border-light"
        >
          <View className="flex-row items-start gap-4">
            <View className="w-10 h-10 bg-forest-100 rounded-full items-center justify-center">
              <EnvelopeSimpleIcon size={20} color="#334d43" weight="fill" />
            </View>
            <View className="flex-1">
              <Text className="text-stone-800 font-semibold text-base mb-1">
                {t("paywall.success.feedbackTitle")}
              </Text>
              <Text className="text-stone-500 text-sm mb-3">
                {t("paywall.success.feedbackDescription")}
              </Text>
              <Pressable
                onPress={handleEmailPress}
                className="flex-row items-center active:opacity-60"
              >
                <Text className="text-primary font-medium text-sm underline">harry@cuisto.app</Text>
              </Pressable>
            </View>
          </View>
        </Animated.View>
      </Animated.View>

      {/* Continue Button - Fixed at bottom */}
      <Animated.View
        entering={FadeInDown.delay(1000).duration(600)}
        className="px-8"
        style={{ paddingBottom: insets.bottom + 24 }}
      >
        <Pressable
          onPress={handleContinue}
          className="w-full bg-primary h-14 rounded-2xl flex-row items-center justify-center gap-2 active:opacity-90"
          style={{ transform: [{ scale: 1 }] }}
        >
          <Text className="text-white font-bold text-sm uppercase tracking-widest">
            {t("paywall.success.continue")}
          </Text>
          <ArrowRightIcon size={16} color="#ffffff" weight="bold" />
        </Pressable>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  confettiContainer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 10,
  },
  confettiPiece: {
    position: "absolute",
  },
});
