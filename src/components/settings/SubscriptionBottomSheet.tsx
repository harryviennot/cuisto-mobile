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
import { Crown, ArrowRight, ArrowSquareOut } from "phosphor-react-native";
import { useTranslation } from "react-i18next";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";

import { PremiumBottomSheet } from "@/components/ui/PremiumBottomSheet";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { PremiumPlanCard, CreditsInfoBox } from "@/components/credits";

interface SubscriptionBottomSheetProps {
  onClose?: () => void;
}

export const SubscriptionBottomSheet = forwardRef<BottomSheetModal, SubscriptionBottomSheetProps>(
  ({ onClose }, ref) => {
    const { t } = useTranslation();
    const router = useRouter();
    const {
      isPremium,
      isTrialing,
      subscriptionExpiresAt,
      standardCredits,
      referralCredits,
      totalCredits,
      nextResetAt,
      restore,
    } = useSubscription();

    const [isRestoring, setIsRestoring] = useState(false);

    const handleDismiss = useCallback(() => {
      onClose?.();
      (ref as React.RefObject<BottomSheetModal>)?.current?.dismiss();
    }, [onClose, ref]);

    const handleUpgrade = useCallback(() => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      handleDismiss();
      // Navigate to custom paywall screen
      router.push("/paywall");
    }, [handleDismiss, router]);

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
            <PremiumPlanCard isTrialing={isTrialing} subscriptionExpiresAt={subscriptionExpiresAt} />
          ) : (
            <CreditsInfoBox totalCredits={totalCredits} standardCredits={standardCredits} referralCredits={referralCredits} nextResetAt={nextResetAt} />
          )}

          {/* Actions */}
          {isPremium ? (
            <Pressable
              onPress={handleManageSubscription}
              className="mt-8 flex-row items-center justify-between rounded-2xl bg-stone-100 p-5 active:opacity-90"
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
              className="mt-8 flex-row items-center justify-center gap-2 rounded-2xl bg-premium py-4 active:bg-premium-dark"
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
