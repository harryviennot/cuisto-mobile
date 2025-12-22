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
import CreditsInfoBox from "@/components/credits/CreditsInfoBox";

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
          {isPremium ? (
            <View className="flex-row items-center gap-4 rounded-3xl bg-amber-400 p-6 shadow-sm">
              <View className="h-14 w-14 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm">
                {isTrialing ? (
                  <Sparkle size={28} color="#1c1917" weight="fill" />
                ) : (
                  <Crown size={28} color="#1c1917" weight="fill" />
                )}
              </View>
              <View className="flex-1">
                <Text className="text-sm font-medium text-stone-900/80">
                  {t("settings.subscription.currentPlan")}
                </Text>
                <Text className="font-playfair-bold text-2xl text-stone-900">
                  {getPlanLabel()}
                </Text>
                {subscriptionExpiresAt && (
                  <Text className="mt-1 text-xs font-medium text-stone-900/80">
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
          ) : (
            <CreditsInfoBox totalCredits={totalCredits} standardCredits={standardCredits} referralCredits={referralCredits} nextResetAt={nextResetAt} />
          )}

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
              className="mt-8 flex-row items-center justify-center gap-2 rounded-2xl bg-amber-500 py-4 active:bg-amber-600 "
            >
              <Crown size={20} color="#ffffff" weight="fill" />
              <Text className="text-base font-semibold text-white">
                {t("credits.bottomSheet.upgradePremium")}
              </Text>
              <ArrowRight size={18} color="#ffffff" weight="bold" />
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
