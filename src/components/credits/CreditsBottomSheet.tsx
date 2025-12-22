/**
 * Credits Bottom Sheet Component
 *
 * Displays detailed credits information with option to upgrade to premium.
 * Shows standard credits, referral credits, and next reset date.
 */
import React, { forwardRef, useCallback, useState } from "react";
import { View, Text, Pressable, ActivityIndicator } from "react-native";
import { BottomSheetModal } from "@gorhom/bottom-sheet";
import { Coins, Crown, Sparkle, ArrowRight, ArrowsClockwise } from "phosphor-react-native";
import { useTranslation } from "react-i18next";
import RevenueCatUI from "react-native-purchases-ui";
import * as Haptics from "expo-haptics";

import { PremiumBottomSheet } from "@/components/ui/PremiumBottomSheet";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { formatDate } from "@/utils/date";

interface CreditsBottomSheetProps {
  onClose?: () => void;
}

export const CreditsBottomSheet = forwardRef<BottomSheetModal, CreditsBottomSheetProps>(
  ({ onClose }, ref) => {
    const { t } = useTranslation();
    const {
      isPremium,
      isTrialing,
      standardCredits,
      referralCredits,
      totalCredits,
      isFirstWeek,
      nextResetAt,
      subscriptionExpiresAt,
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
        console.error("[CreditsBottomSheet] Paywall error:", error);
      }
    }, [refreshCredits, refreshSubscription, handleDismiss]);

    const handleRestore = useCallback(async () => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setIsRestoring(true);
      try {
        const restored = await restore();
        if (restored) {
          handleDismiss();
        }
      } catch (error) {
        console.error("[CreditsBottomSheet] Restore error:", error);
      } finally {
        setIsRestoring(false);
      }
    }, [restore, handleDismiss]);

    const formatResetDate = useCallback(() => {
      if (!nextResetAt) return "";
      return formatDate(nextResetAt, "EEEE, MMM d");
    }, [nextResetAt]);

    return (
      <PremiumBottomSheet
        ref={ref}
        title={t("credits.bottomSheet.title")}
        onClose={handleDismiss}
      >
        <View className="px-6 pb-4">
          {/* Premium Status */}
          {isPremium ? (
            <View className="mb-6">
              <View className="flex-row items-center gap-3 rounded-2xl bg-amber-50 p-5">
                <View className="h-14 w-14 items-center justify-center rounded-full bg-amber-100">
                  {isTrialing ? (
                    <Sparkle size={28} color="#2D5A27" weight="fill" />
                  ) : (
                    <Crown size={28} color="#d97706" weight="fill" />
                  )}
                </View>
                <View className="flex-1">
                  <Text className="font-playfair-bold text-xl text-stone-900">
                    {isTrialing ? t("credits.trial") : t("credits.premium")}
                  </Text>
                  <Text className="text-sm text-stone-600">
                    {t("credits.bottomSheet.unlimitedExtractions")}
                  </Text>
                  {subscriptionExpiresAt && (
                    <Text className="mt-1 text-xs text-stone-500">
                      {isTrialing
                        ? t("settings.subscription.trialEnds", {
                            date: formatDate(subscriptionExpiresAt, "MMM d"),
                          })
                        : t("credits.bottomSheet.nextReset", {
                            date: formatDate(subscriptionExpiresAt, "MMM d"),
                          })}
                    </Text>
                  )}
                </View>
              </View>
            </View>
          ) : (
            <>
              {/* Credits Overview */}
              <View className="mb-6 rounded-2xl bg-stone-100 p-5">
                <View className="flex-row items-center justify-between">
                  <View className="flex-row items-center gap-3">
                    <View className="h-14 w-14 items-center justify-center rounded-full bg-stone-200">
                      <Coins size={28} color="#57534e" weight="duotone" />
                    </View>
                    <View>
                      <Text className="font-playfair-bold text-4xl text-stone-900">
                        {totalCredits}
                      </Text>
                      <Text className="text-sm text-stone-600">
                        {t("credits.remaining", { count: totalCredits })}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Credits Breakdown */}
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
                </View>

                {/* Next Reset */}
                {nextResetAt && (
                  <View className="mt-4 flex-row items-center gap-2 border-t border-stone-200 pt-4">
                    <ArrowsClockwise size={16} color="#78716c" />
                    <Text className="text-sm text-stone-500">
                      {t("credits.bottomSheet.nextReset", { date: formatResetDate() })}
                    </Text>
                  </View>
                )}
              </View>

              {/* First Week Bonus */}
              {isFirstWeek && (
                <View className="mb-6 rounded-2xl bg-primary/10 p-4">
                  <View className="flex-row items-center gap-2">
                    <Sparkle size={20} color="#2D5A27" weight="fill" />
                    <Text className="flex-1 text-sm font-medium text-primary">
                      {t("credits.bottomSheet.firstWeekBonus")}
                    </Text>
                  </View>
                </View>
              )}

              {/* Upgrade CTA */}
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
                      {t("credits.bottomSheet.upgradePremium")}
                    </Text>
                    <Text className="text-sm text-white/80">
                      {t("credits.bottomSheet.unlimitedExtractions")}
                    </Text>
                  </View>
                </View>
                <ArrowRight size={20} color="#fff" />
              </Pressable>

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
            </>
          )}
        </View>
      </PremiumBottomSheet>
    );
  }
);

CreditsBottomSheet.displayName = "CreditsBottomSheet";
