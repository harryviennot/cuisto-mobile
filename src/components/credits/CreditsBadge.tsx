/**
 * Credits Badge Component
 *
 * Displays the user's remaining extraction credits or premium status.
 * Shows in the header or extraction screens.
 */
import { View, Text, Pressable } from "react-native";
import { Coins, CoinsIcon, Crown, Sparkle } from "phosphor-react-native";
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
  const { isPremium, isTrialing, totalCredits, isFirstWeek, isLoading } = useSubscription();

  const iconSize = size === "small" ? 16 : 24;
  const textSize = size === "small" ? "text-xs" : "text-sm";
  const padding = size === "small" ? "px-2 py-1" : "px-3 py-1.5";

  if (isLoading) {
    return (
      <View className={cn("flex-row items-center rounded-full bg-surface-elevated gap-2", padding, className)}>
        <CoinsIcon size={iconSize} color="#334d43" weight="duotone" />
        <Skeleton width={iconSize} height={iconSize} />
      </View>
    );
  }

  // Premium user - Forest green badge for consistency
  if (isPremium) {
    return (
      <Pressable onPress={onPress} className={cn("overflow-hidden rounded-full font-medium shadow-sm", className)}>
        <View className={cn("flex-row items-center gap-1.5 bg-forest-600", padding)}>
          {isTrialing ? (
            <Sparkle size={iconSize} color="#f4f1e8" weight="fill" />
          ) : (
            <Crown size={iconSize} color="#f4f1e8" weight="fill" />
          )}
          {showLabel && (
            <Text className={cn(textSize, "font-bold text-white")}>
              {isTrialing ? t("credits.trial") : t("credits.premium")}
            </Text>
          )}
        </View>
      </Pressable>
    );
  }

  // Free user with credits
  const isLowCredits = totalCredits <= 1;
  const creditColor = isLowCredits ? "text-state-error" : "text-foreground-secondary";
  const bgColor = isLowCredits ? "bg-red-50" : "bg-surface-elevated";
  const iconColor = isLowCredits ? "#dc2626" : "#334d43";

  return (
    <Pressable
      onPress={onPress}
      className={cn("flex-row items-center gap-1.5 rounded-full", bgColor, padding, className)}
    >
      <CoinsIcon size={iconSize} color={iconColor} weight="duotone" />
      <Text className={cn(textSize, "font-medium text-md", creditColor)}>
        {totalCredits}
      </Text>
      {/* {showLabel && isFirstWeek && (
        <View className="ml-1 rounded-full bg-primary/10 px-1.5 py-0.5">
          <Text className="text-[10px] font-medium text-primary">
            {t("credits.firstWeek")}
          </Text>
        </View>
      )} */}
    </Pressable>
  );
}
