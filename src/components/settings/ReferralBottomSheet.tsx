/**
 * Referral Bottom Sheet Component
 *
 * Displays user's referral code with copy/share functionality.
 * Shows referral statistics (friends referred, credits earned).
 */
import React, { forwardRef, useCallback, useEffect, useState } from "react";
import { View, Text, Pressable, Share, ActivityIndicator } from "react-native";
import { BottomSheetModal } from "@gorhom/bottom-sheet";
import { Copy, ShareNetwork, Gift, Check, Users } from "phosphor-react-native";
import { useTranslation } from "react-i18next";
import * as Clipboard from "expo-clipboard";
import * as Haptics from "expo-haptics";

import { PremiumBottomSheet } from "@/components/ui/PremiumBottomSheet";
import { referralsService, ReferralStatsResponse } from "@/api/services/referrals.service";

interface ReferralBottomSheetProps {
  onClose?: () => void;
}

export const ReferralBottomSheet = forwardRef<BottomSheetModal, ReferralBottomSheetProps>(
  ({ onClose }, ref) => {
    const { t } = useTranslation();
    const [code, setCode] = useState<string | null>(null);
    const [stats, setStats] = useState<ReferralStatsResponse | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isCopied, setIsCopied] = useState(false);

    useEffect(() => {
      loadReferralData();
    }, []);

    const loadReferralData = async () => {
      setIsLoading(true);
      try {
        const [codeResponse, statsResponse] = await Promise.all([
          referralsService.getCode(),
          referralsService.getStats(),
        ]);
        setCode(codeResponse.code);
        setStats(statsResponse);
      } catch (error) {
        console.error("[ReferralBottomSheet] Error loading data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    const handleDismiss = useCallback(() => {
      onClose?.();
      (ref as React.RefObject<BottomSheetModal>)?.current?.dismiss();
    }, [onClose, ref]);

    const handleCopy = useCallback(async () => {
      if (!code) return;

      await Clipboard.setStringAsync(code);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setIsCopied(true);

      setTimeout(() => {
        setIsCopied(false);
      }, 2000);
    }, [code]);

    const handleShare = useCallback(async () => {
      if (!code) return;

      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      try {
        await Share.share({
          message: t("settings.referral.shareMessage", { code }),
        });
      } catch (error) {
        console.error("[ReferralBottomSheet] Share error:", error);
      }
    }, [code, t]);

    return (
      <PremiumBottomSheet
        ref={ref}
        title={t("settings.referral.title")}
        onClose={handleDismiss}
      >
        <View className="px-6 pb-4">
          {isLoading ? (
            <View className="items-center py-8">
              <ActivityIndicator size="large" color="#2D5A27" />
            </View>
          ) : (
            <>
              {/* Referral Code Card */}
              <View className="mb-6 rounded-2xl bg-primary/10 p-5">
                <Text className="mb-2 text-center text-sm text-stone-600">
                  {t("settings.referral.yourCode")}
                </Text>
                <Text className="text-center font-mono text-3xl font-bold tracking-widest text-primary">
                  {code}
                </Text>

                {/* Copy Button */}
                <Pressable
                  onPress={handleCopy}
                  className="mt-4 flex-row items-center justify-center gap-2 rounded-xl bg-white py-3 active:opacity-90"
                >
                  {isCopied ? (
                    <>
                      <Check size={20} color="#2D5A27" weight="bold" />
                      <Text className="font-medium text-primary">
                        {t("settings.referral.copied")}
                      </Text>
                    </>
                  ) : (
                    <>
                      <Copy size={20} color="#2D5A27" weight="duotone" />
                      <Text className="font-medium text-primary">
                        {t("settings.referral.copyCode")}
                      </Text>
                    </>
                  )}
                </Pressable>
              </View>

              {/* Stats */}
              {stats && (
                <View className="mb-6 flex-row gap-4">
                  <View className="flex-1 rounded-xl bg-stone-100 p-4">
                    <View className="mb-2 flex-row items-center gap-2">
                      <Users size={18} color="#78716c" weight="duotone" />
                      <Text className="text-sm text-stone-500">
                        {t("settings.referral.stats.friendsReferred", {
                          count: stats.uses_count,
                        })}
                      </Text>
                    </View>
                    <Text className="font-playfair-bold text-2xl text-stone-900">
                      {stats.uses_count}
                    </Text>
                  </View>
                  <View className="flex-1 rounded-xl bg-stone-100 p-4">
                    <View className="mb-2 flex-row items-center gap-2">
                      <Gift size={18} color="#78716c" weight="duotone" />
                      <Text className="text-sm text-stone-500">
                        {t("settings.referral.stats.creditsEarned", {
                          count: stats.total_credits_earned,
                        })}
                      </Text>
                    </View>
                    <Text className="font-playfair-bold text-2xl text-primary">
                      {stats.total_credits_earned}
                    </Text>
                  </View>
                </View>
              )}

              {/* Share Button */}
              <Pressable
                onPress={handleShare}
                className="flex-row items-center justify-center gap-2 rounded-2xl bg-primary py-4 active:opacity-90"
              >
                <ShareNetwork size={20} color="#fff" weight="fill" />
                <Text className="font-medium text-white">
                  {t("settings.referral.share")}
                </Text>
              </Pressable>

              {/* Info text */}
              <Text className="mt-4 text-center text-sm text-stone-500">
                {t("onboarding.referral.bonus")}
              </Text>
            </>
          )}
        </View>
      </PremiumBottomSheet>
    );
  }
);

ReferralBottomSheet.displayName = "ReferralBottomSheet";
