/**
 * Credits Bottom Sheet Component
 *
 * Displays detailed credits information with option to upgrade to premium.
 * Shows standard credits, referral credits, and next reset date.
 */
import React, { forwardRef, useCallback, useState } from "react";
import { View, Text, Pressable, ActivityIndicator } from "react-native";
import { BottomSheetModal } from "@gorhom/bottom-sheet";
import { Coins, Crown, Sparkle, ArrowRight } from "phosphor-react-native";
import { useTranslation } from "react-i18next";
import RevenueCatUI from "react-native-purchases-ui";
import * as Haptics from "expo-haptics";

import { PremiumBottomSheet } from "@/components/ui/PremiumBottomSheet";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { formatDate } from "@/utils/date";
import CreditsInfoBox from "./CreditsInfoBox";

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


    return (
      <PremiumBottomSheet
        ref={ref}
        title={t("credits.bottomSheet.title")}
        onClose={handleDismiss}
      >
        <View className="px-6">
          {isPremium ? (
            // Premium Status
            <View className="flex-row items-center gap-4 rounded-2xl bg-forest-600 p-5">
              <View className="h-12 w-12 items-center justify-center rounded-full bg-white/15">
                {isTrialing ? (
                  <Sparkle size={24} color="#ffffff" weight="fill" />
                ) : (
                  <Crown size={24} color="#ffffff" weight="fill" />
                )}
              </View>
              <View className="flex-1">
                <Text className="font-playfair-bold text-xl text-white">
                  {isTrialing ? t("credits.trial") : t("credits.premium")}
                </Text>
                <Text className="text-sm text-white/80">
                  {t("credits.bottomSheet.unlimitedExtractions")}
                </Text>
                {subscriptionExpiresAt && (
                  <Text className="mt-1 text-xs text-white/60">
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
          ) : (
            <View className="gap-4">
              {/* Hero Card: Total Available Credits */}
              <CreditsInfoBox totalCredits={totalCredits} standardCredits={standardCredits} referralCredits={referralCredits} nextResetAt={nextResetAt} />
              {/* Upgrade CTA */}
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

              {/* Restore Purchases */}
              <Pressable
                onPress={handleRestore}
                disabled={isRestoring}
                className="items-center py-2"
              >
                {isRestoring ? (
                  <ActivityIndicator size="small" color="#78716c" />
                ) : (
                  <Text className="text-xs text-stone-400">
                    {t("credits.bottomSheet.restorePurchases")}
                  </Text>
                )}
              </Pressable>
            </View>
          )}
        </View>
      </PremiumBottomSheet>
    );
  }
);

CreditsBottomSheet.displayName = "CreditsBottomSheet";
