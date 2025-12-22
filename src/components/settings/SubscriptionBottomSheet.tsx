/**
 * Subscription Bottom Sheet Component
 *
 * Displays current subscription status and provides options to:
 * - View plan details
 * - Upgrade to premium (for free users)
 * - Manage subscription (for premium users)
 * - Restore purchases
 */
import React, { forwardRef, useCallback, useState } from "react";
import { View, Text, Pressable, Linking, Platform, ActivityIndicator } from "react-native";
import { BottomSheetModal } from "@gorhom/bottom-sheet";
import { Crown, Sparkle, Coins, ArrowRight, ArrowSquareOut, ArrowsClockwise } from "phosphor-react-native";
import { useTranslation } from "react-i18next";
import RevenueCatUI from "react-native-purchases-ui";
import * as Haptics from "expo-haptics";

import { PremiumBottomSheet } from "@/components/ui/PremiumBottomSheet";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { formatDate } from "@/utils/date";

interface SubscriptionBottomSheetProps {
  onClose?: () => void;
}

export const SubscriptionBottomSheet = forwardRef<BottomSheetModal, SubscriptionBottomSheetProps>(
  ({ onClose }, ref) => {
    const { t } = useTranslation();
    const {
      isPremium,
      isTrialing,
      subscriptionExpiresAt,
      standardCredits,
      referralCredits,
      totalCredits,
      isFirstWeek,
      nextResetAt,
      refreshCredits,
      refreshSubscription,
      restore,
    } = useSubscription();

    const [isRestoring, setIsRestoring] = useState(false);

    const handleDismiss = useCallback(() => {
      onClose?.();
      (ref as React.RefObject<BottomSheetModal>)?.current?.dismiss();
    }, [onClose, ref]);

    const handleUpgrade = useCallback(async () => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      try {
        const result = await RevenueCatUI.presentPaywall();
        if (result === "PURCHASED" || result === "RESTORED") {
          await refreshCredits();
          await refreshSubscription();
          handleDismiss();
        }
      } catch (error) {
        console.error("[SubscriptionBottomSheet] Paywall error:", error);
      }
    }, [refreshCredits, refreshSubscription, handleDismiss]);

    const handleManageSubscription = useCallback(() => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      if (Platform.OS === "ios") {
        Linking.openURL("https://apps.apple.com/account/subscriptions");
      } else {
        Linking.openURL("https://play.google.com/store/account/subscriptions");
      }
    }, []);

    const handleRestore = useCallback(async () => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setIsRestoring(true);
      try {
        await restore();
      } catch (error) {
        console.error("[SubscriptionBottomSheet] Restore error:", error);
      } finally {
        setIsRestoring(false);
      }
    }, [restore]);

    const getPlanLabel = () => {
      if (isPremium) {
        return isTrialing
          ? t("settings.subscription.trial")
          : t("settings.subscription.premium");
      }
      return t("settings.subscription.free");
    };

    return (
      <PremiumBottomSheet
        ref={ref}
        title={t("settings.subscription.title")}
        onClose={handleDismiss}
      >
        <View className="px-6 pb-4">
          {/* Current Plan Card */}
          <View
            className={`mb-6 rounded-2xl p-5 ${
              isPremium ? "bg-amber-50" : "bg-stone-100"
            }`}
          >
            <View className="flex-row items-center gap-4">
              <View
                className={`h-14 w-14 items-center justify-center rounded-full ${
                  isPremium ? "bg-amber-100" : "bg-stone-200"
                }`}
              >
                {isPremium ? (
                  isTrialing ? (
                    <Sparkle size={28} color="#2D5A27" weight="fill" />
                  ) : (
                    <Crown size={28} color="#d97706" weight="fill" />
                  )
                ) : (
                  <Coins size={28} color="#57534e" weight="duotone" />
                )}
              </View>
              <View className="flex-1">
                <Text className="text-sm text-stone-500">
                  {t("settings.subscription.currentPlan")}
                </Text>
                <Text className="font-playfair-bold text-2xl text-stone-900">
                  {getPlanLabel()}
                </Text>
                {isPremium && subscriptionExpiresAt && (
                  <Text className="text-sm text-stone-600">
                    {isTrialing
                      ? t("settings.subscription.trialEnds", {
                          date: formatDate(subscriptionExpiresAt, "MMM d, yyyy"),
                        })
                      : t("credits.bottomSheet.nextReset", {
                          date: formatDate(subscriptionExpiresAt, "MMM d, yyyy"),
                        })}
                  </Text>
                )}
              </View>
            </View>

            {/* Credits Breakdown for free users */}
            {!isPremium && (
              <View className="mt-4 space-y-2 border-t border-stone-200 pt-4">
                <View className="flex-row items-center justify-between">
                  <Text className="text-sm text-stone-600">
                    {t("credits.bottomSheet.standardCredits")}
                  </Text>
                  <Text className="font-medium text-stone-900">{standardCredits}</Text>
                </View>
                {referralCredits > 0 && (
                  <View className="flex-row items-center justify-between">
                    <Text className="text-sm text-stone-600">
                      {t("credits.bottomSheet.referralCredits")}
                    </Text>
                    <Text className="font-medium text-primary">{referralCredits}</Text>
                  </View>
                )}
                <View className="flex-row items-center justify-between">
                  <Text className="text-sm font-medium text-stone-900">
                    {t("credits.remaining", { count: totalCredits })}
                  </Text>
                  <Text className="font-bold text-stone-900">{totalCredits}</Text>
                </View>
                {nextResetAt && (
                  <View className="flex-row items-center gap-2 pt-2">
                    <ArrowsClockwise size={14} color="#78716c" />
                    <Text className="text-xs text-stone-500">
                      {t("credits.bottomSheet.nextReset", {
                        date: formatDate(nextResetAt, "EEEE, MMM d"),
                      })}
                    </Text>
                  </View>
                )}
                {isFirstWeek && (
                  <View className="mt-2 rounded-lg bg-primary/10 p-2">
                    <Text className="text-center text-xs font-medium text-primary">
                      {t("credits.bottomSheet.firstWeekBonus")}
                    </Text>
                  </View>
                )}
              </View>
            )}
          </View>

          {/* Actions */}
          {isPremium ? (
            <Pressable
              onPress={handleManageSubscription}
              className="flex-row items-center justify-between rounded-2xl bg-stone-100 p-5 active:opacity-90"
            >
              <View className="flex-row items-center gap-3">
                <ArrowSquareOut size={20} color="#57534e" weight="duotone" />
                <Text className="font-medium text-stone-900">
                  {t("settings.subscription.manageSubscription")}
                </Text>
              </View>
              <ArrowRight size={20} color="#a8a29e" />
            </Pressable>
          ) : (
            <Pressable
              onPress={handleUpgrade}
              className="flex-row items-center justify-between rounded-2xl bg-primary p-5 active:opacity-90"
            >
              <View className="flex-row items-center gap-3">
                <View className="h-10 w-10 items-center justify-center rounded-full bg-white/20">
                  <Crown size={20} color="#fff" weight="fill" />
                </View>
                <View>
                  <Text className="font-playfair-bold text-lg text-white">
                    {t("settings.subscription.upgradeToPremium")}
                  </Text>
                  <Text className="text-sm text-white/80">
                    {t("credits.bottomSheet.unlimitedExtractions")}
                  </Text>
                </View>
              </View>
              <ArrowRight size={20} color="#fff" />
            </Pressable>
          )}

          {/* Restore Purchases */}
          <Pressable
            onPress={handleRestore}
            disabled={isRestoring}
            className="mt-4 items-center py-2"
          >
            {isRestoring ? (
              <ActivityIndicator size="small" color="#78716c" />
            ) : (
              <Text className="text-sm text-stone-500 underline">
                {t("credits.bottomSheet.restorePurchases")}
              </Text>
            )}
          </Pressable>
        </View>
      </PremiumBottomSheet>
    );
  }
);

SubscriptionBottomSheet.displayName = "SubscriptionBottomSheet";
