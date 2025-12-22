/**
 * Premium Plan Card Component
 *
 * Displays the user's premium plan with a gold scintillation effect.
 */
import { useEffect } from "react";
import { View, Text, Pressable } from "react-native";
import { CrownIcon, SparkleIcon } from "phosphor-react-native";
import { useTranslation } from "react-i18next";
import { LinearGradient } from "expo-linear-gradient";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withRepeat,
  withSequence,
  Easing,
  interpolate,
  cancelAnimation,
} from "react-native-reanimated";

import { formatDate } from "@/utils/date";
import { cn } from "@/utils/cn";

interface PremiumPlanCardProps {
  isTrialing?: boolean;
  subscriptionExpiresAt?: Date | null;
  className?: string;
  onPress?: () => void;
}

export function PremiumPlanCard({
  isTrialing = false,
  subscriptionExpiresAt,
  className,
  onPress,
}: PremiumPlanCardProps) {
  const { t } = useTranslation();

  // Scintillation animation - sweeps across every 3 seconds
  const scintPosition = useSharedValue(-1);

  useEffect(() => {
    // Animate: quick sweep (800ms) then pause (3000ms) cycle
    scintPosition.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 800, easing: Easing.inOut(Easing.ease) }),
        withDelay(3000, withTiming(-1, { duration: 0 }))
      ),
      -1,
      false
    );

    // Cancel animation on unmount to prevent memory leaks
    return () => {
      cancelAnimation(scintPosition);
    };
  }, [scintPosition]);

  const scintStyle = useAnimatedStyle(() => {
    const translateX = interpolate(scintPosition.value, [-1, 1], [-150, 400]);

    return {
      transform: [{ translateX }, { skewX: "-20deg" }],
    };
  });

  return (
    <Pressable onPress={onPress} disabled={!onPress} className={cn("flex-row items-center gap-4 rounded-3xl bg-premium-light p-6 overflow-hidden", className)}>
      <View className="h-14 w-14 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm">
        {isTrialing ? (
          <SparkleIcon size={28} color="#1c1917" weight="fill" />
        ) : (
          <CrownIcon size={28} color="#1c1917" weight="fill" />
        )}
      </View>
      <View className="flex-1">
        <Text className="text-premium-foreground text-[10px] font-bold tracking-widest uppercase">
          {t("settings.subscription.currentPlan")}
        </Text>
        <Text className="font-playfair-bold text-2xl text-premium-foreground">
          {isTrialing
            ? t("settings.subscription.trial")
            : t("settings.subscription.premium")}
        </Text>
        {subscriptionExpiresAt && (
          <Text className="mt-1 text-xs font-medium text-muted">
            {isTrialing
              ? t("settings.subscription.trialEnds", {
                date: formatDate(subscriptionExpiresAt, "MMM d, yyyy"),
              })
              : t("credits.bottomSheet.renewsOn", {
                date: formatDate(subscriptionExpiresAt, "MMM d, yyyy"),
              })}
          </Text>
        )}
      </View>

      {/* Gold scintillation overlay */}
      <Animated.View
        style={[
          {
            position: "absolute",
            top: 0,
            bottom: 0,
            width: 80,
          },
          scintStyle,
        ]}
        pointerEvents="none"
      >
        <LinearGradient
          colors={[
            "transparent",
            "rgba(255, 255, 255, 0.15)",
            "rgba(255, 255, 255, 0.4)",
            "rgba(255, 255, 255, 0.15)",
            "transparent",
          ]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={{ width: 80, height: "100%" }}
        />
      </Animated.View>
    </Pressable>
  );
}
