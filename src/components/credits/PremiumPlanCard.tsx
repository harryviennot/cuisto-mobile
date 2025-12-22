/**
 * Premium Plan Card Component
 *
 * Displays the user's premium plan.
 */
import { View, Text } from "react-native";
import { CrownIcon, SparkleIcon } from "phosphor-react-native";
import { useTranslation } from "react-i18next";
import { formatDate } from "@/utils/date";

interface PremiumPlanCardProps {
  isTrialing?: boolean;
  subscriptionExpiresAt?: Date | null;
}

export function PremiumPlanCard({
  isTrialing = false,
  subscriptionExpiresAt,
}: PremiumPlanCardProps) {
  const { t } = useTranslation();

  return (
    <View className="flex-row items-center gap-4 rounded-3xl bg-premium-light p-6">
      <View className="h-14 w-14 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm">
        {isTrialing ? (
          <SparkleIcon size={28} color="#1c1917" weight="fill" />
        ) : (
          <CrownIcon size={28} color="#1c1917" weight="fill" />
        )}
      </View>
      <View className="flex-1">
        <Text className="text-sm font-medium text-premium-foreground">
          {t("settings.subscription.currentPlan")}
        </Text>
        <Text className="font-playfair-bold text-2xl text-premium-foreground">
          {isTrialing
            ? t("settings.subscription.trial")
            : t("settings.subscription.premium")}
        </Text>
        {subscriptionExpiresAt && (
          <Text className="mt-1 text-xs font-medium text-premium-foreground">
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
    </View>
  );
}
