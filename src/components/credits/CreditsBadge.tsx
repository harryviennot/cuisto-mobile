/**
 * Credits Badge Component
 *
 * Displays the user's remaining extraction credits or premium status.
 * Shows in the header or extraction screens.
 */
import { View, Text, TouchableOpacity } from "react-native";
import { CoinsIcon, CrownIcon, SparkleIcon } from "phosphor-react-native";
import { useTranslation } from "react-i18next";

import { useSubscription } from "@/contexts/SubscriptionContext";
import { cn } from "@/utils/cn";
import { Skeleton } from "../ui/Skeleton";

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
  const { isPremium, isTrialing, totalCredits, isLoading } = useSubscription();

  const iconSize = size === "small" ? 16 : 24;
  const textSize = size === "small" ? "text-xs" : "text-sm";
  const padding = size === "small" ? "px-2 py-1" : "px-3 py-1.5";

  if (isLoading) {
    return (
      <View
        className={cn(
          "flex-row items-center rounded-full bg-surface-elevated gap-2",
          padding,
          className
        )}
      >
        <CoinsIcon size={iconSize} color="#334d43" weight="duotone" />
        <Skeleton width={iconSize} height={iconSize} />
      </View>
    );
  }

  // Premium user - Forest green badge for consistency
  if (isPremium) {
    return (
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.7}
        className={cn("overflow-hidden rounded-full font-medium", className)}
      >
        <View className={cn("flex-row items-center gap-1.5 bg-premium", padding)}>
          {isTrialing ? (
            <SparkleIcon size={iconSize} color="#f4f1e8" weight="fill" />
          ) : (
            <CrownIcon size={iconSize} color="#f4f1e8" weight="fill" />
          )}
          {showLabel && (
            <Text className={cn(textSize, "font-bold text-white")}>
              {isTrialing ? t("credits.trial") : t("credits.premium")}
            </Text>
          )}
        </View>
      </TouchableOpacity>
    );
  }

  // Free user with credits
  const isLowCredits = totalCredits <= 1;
  const creditColor = isLowCredits ? "text-state-error" : "text-foreground-secondary";
  const bgColor = isLowCredits ? "bg-red-50" : "bg-surface-elevated";
  const iconColor = isLowCredits ? "#dc2626" : "#334d43";

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      className={cn("flex-row items-center gap-1.5 rounded-full", bgColor, padding, className)}
    >
      <CoinsIcon size={iconSize} color={iconColor} weight="duotone" />
      <Text className={cn(textSize, "font-medium text-md", creditColor)}>{totalCredits}</Text>
    </TouchableOpacity>
  );
}
