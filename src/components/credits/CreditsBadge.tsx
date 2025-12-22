/**
 * Credits Badge Component
 *
 * Displays the user's remaining extraction credits or premium status.
 * Shows in the header or extraction screens.
 */
import { View, Text, Pressable } from "react-native";
import { Coins, Crown, Sparkle } from "phosphor-react-native";
import { useTranslation } from "react-i18next";

import { useSubscription } from "@/contexts/SubscriptionContext";
import { cn } from "@/utils/cn";

interface CreditsBadgeProps {
  onPress?: () => void;
  size?: "small" | "medium";
  showLabel?: boolean;
  className?: string;
}

export function CreditsBadge({
  onPress,
  size = "medium",
  showLabel = true,
  className,
}: CreditsBadgeProps) {
  const { t } = useTranslation();
  const { isPremium, isTrialing, totalCredits, isFirstWeek, isLoading } = useSubscription();

  const iconSize = size === "small" ? 16 : 20;
  const textSize = size === "small" ? "text-xs" : "text-sm";
  const padding = size === "small" ? "px-2 py-1" : "px-3 py-1.5";

  if (isLoading) {
    return (
      <View className={cn("flex-row items-center rounded-full bg-surface-elevated", padding, className)}>
        <View className="h-4 w-8 animate-pulse rounded bg-border" />
      </View>
    );
  }

  // Premium user
  if (isPremium) {
    return (
      <Pressable
        onPress={onPress}
        className={cn(
          "flex-row items-center gap-1.5 rounded-full",
          isTrialing ? "bg-primary/10" : "bg-amber-100",
          padding,
          className
        )}
      >
        {isTrialing ? (
          <Sparkle size={iconSize} color="#2D5A27" weight="fill" />
        ) : (
          <Crown size={iconSize} color="#d97706" weight="fill" />
        )}
        {showLabel && (
          <Text className={cn(textSize, "font-medium", isTrialing ? "text-primary" : "text-amber-700")}>
            {isTrialing ? t("credits.trial") : t("credits.premium")}
          </Text>
        )}
      </Pressable>
    );
  }

  // Free user with credits
  const isLowCredits = totalCredits <= 1;
  const creditColor = isLowCredits ? "text-state-error" : "text-foreground-secondary";
  const bgColor = isLowCredits ? "bg-red-50" : "bg-surface-elevated";
  const iconColor = isLowCredits ? "#dc2626" : "#78716c";

  return (
    <Pressable
      onPress={onPress}
      className={cn("flex-row items-center gap-1.5 rounded-full", bgColor, padding, className)}
    >
      <Coins size={iconSize} color={iconColor} weight="duotone" />
      <Text className={cn(textSize, "font-medium", creditColor)}>
        {totalCredits}
      </Text>
      {showLabel && isFirstWeek && (
        <View className="ml-1 rounded-full bg-primary/10 px-1.5 py-0.5">
          <Text className="text-[10px] font-medium text-primary">
            {t("credits.firstWeek")}
          </Text>
        </View>
      )}
    </Pressable>
  );
}
