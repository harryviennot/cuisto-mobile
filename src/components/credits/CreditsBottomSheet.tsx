/**
 * Credits Bottom Sheet Component
 *
 * Displays detailed credits information with option to upgrade to premium.
 * Shows standard credits, referral credits, and next reset date.
 */
import React, { forwardRef, useCallback, useState } from "react";
import { View, Text, Pressable, ActivityIndicator } from "react-native";
import { BottomSheetModal } from "@gorhom/bottom-sheet";
import { Crown, ArrowRight } from "phosphor-react-native";
import { useTranslation } from "react-i18next";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";

import { PremiumBottomSheet } from "@/components/ui/PremiumBottomSheet";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { CreditsInfoBox } from "./CreditsInfoBox";
import { PremiumPlanCard } from "./PremiumPlanCard";

interface CreditsBottomSheetProps {
  onClose?: () => void;
}

export const CreditsBottomSheet = forwardRef<BottomSheetModal, CreditsBottomSheetProps>(
  ({ onClose }, ref) => {
    const { t } = useTranslation();
    const router = useRouter();
    const {
      isPremium,
      isTrialing,
      standardCredits,
      referralCredits,
      totalCredits,
      nextResetAt,
      subscriptionExpiresAt,
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
            <PremiumPlanCard isTrialing={isTrialing} subscriptionExpiresAt={subscriptionExpiresAt} />
          ) : (
            <View className="gap-4">
              {/* Hero Card: Total Available Credits */}
              <CreditsInfoBox totalCredits={totalCredits} standardCredits={standardCredits} referralCredits={referralCredits} nextResetAt={nextResetAt} />
              {/* Upgrade CTA */}
              <Pressable
                onPress={handleUpgrade}
                className="mt-8 flex-row items-center justify-center gap-2 rounded-2xl bg-premium py-4 active:bg-premium-dark"
              >
                <Crown size={20} color="#ffffff" weight="fill" />
                <Text className="text-base font-semibold text-premium-foreground">
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
