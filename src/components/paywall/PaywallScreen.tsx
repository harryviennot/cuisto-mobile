/**
 * Paywall Screen Component
 *
 * Full-screen modal for premium subscription.
 * Matches Cuisto's design system with welcome page styling.
 */
import React, { useEffect, useState, useCallback } from "react";
import { View, Text, ScrollView, Pressable, ActivityIndicator, Linking } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";

import {
  X,
  InfinityIcon,
  ChefHat,
  Globe,
  Sparkle,
  ArrowRightIcon,
} from "phosphor-react-native";
import Animated, {
  useAnimatedStyle,
  withTiming,
  withDelay,
  withRepeat,
  withSequence,
  useSharedValue,
  Easing,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { PurchasesPackage } from "react-native-purchases";
import Toast from "react-native-toast-message";
import { toastConfig } from "@/components/ui/ToastConfig";

import { FeatureRow } from "./FeatureRow";
import { PricingCard } from "./PricingCard";
import { ActionButton } from "@/components/ui/ActionButton";
import { getOfferings, purchasePackage, restorePurchases } from "@/lib/revenuecat";
import { useSubscription } from "@/contexts/SubscriptionContext";

export function PaywallScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { t } = useTranslation();
  const { refreshSubscription } = useSubscription();

  const [mounted, setMounted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [monthlyPackage, setMonthlyPackage] = useState<PurchasesPackage | null>(null);
  const [yearlyPackage, setYearlyPackage] = useState<PurchasesPackage | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<"monthly" | "yearly">("yearly");

  // Sparkle animation for badge
  const sparkleRotation = useSharedValue(0);

  useEffect(() => {
    setMounted(true);
    loadOfferings();

    // Gentle sparkle rotation
    sparkleRotation.value = withRepeat(
      withSequence(
        withTiming(15, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
        withTiming(-15, { duration: 1500, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
  }, []);

  const sparkleStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${sparkleRotation.value}deg` }],
  }));

  const loadOfferings = async () => {
    try {
      const offering = await getOfferings();
      if (offering) {
        // Find packages by package type (MONTHLY, ANNUAL) - more reliable than product IDs
        const monthly = offering.availablePackages.find(
          (pkg) => pkg.packageType === "MONTHLY"
        );
        const yearly = offering.availablePackages.find(
          (pkg) => pkg.packageType === "ANNUAL"
        );
        setMonthlyPackage(monthly || null);
        setYearlyPackage(yearly || null);
      }
    } catch (err) {
      console.error("[Paywall] Error loading offerings:", err);
      Toast.show({
        type: "error",
        text1: t("paywall.errors.loadingFailed"),
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  }, [router]);

  const handlePurchase = async () => {
    const packageToPurchase = selectedPlan === "yearly" ? yearlyPackage : monthlyPackage;
    if (!packageToPurchase) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsPurchasing(true);

    try {
      const customerInfo = await purchasePackage(packageToPurchase);
      if (customerInfo) {
        // Sync with backend
        await refreshSubscription();
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        router.back();
      }
    } catch (err: any) {
      if (!err.userCancelled) {
        console.error("[Paywall] Purchase error:", err);
        Toast.show({
          type: "error",
          text1: t("paywall.errors.purchaseFailed"),
        });
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
    } finally {
      setIsPurchasing(false);
    }
  };

  const handleRestore = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsRestoring(true);

    try {
      const customerInfo = await restorePurchases();
      if (customerInfo) {
        await refreshSubscription();
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        router.back();
      }
    } catch (err) {
      console.error("[Paywall] Restore error:", err);
      Toast.show({
        type: "error",
        text1: t("paywall.errors.restoreFailed"),
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setIsRestoring(false);
    }
  };

  // Animation styles
  const headerStyle = useAnimatedStyle(() => ({
    opacity: withTiming(mounted ? 1 : 0, { duration: 600 }),
    transform: [
      {
        translateY: withTiming(mounted ? 0 : 20, {
          duration: 600,
          easing: Easing.out(Easing.cubic),
        }),
      },
    ],
  }));

  const contentStyle = useAnimatedStyle(() => ({
    opacity: withDelay(200, withTiming(mounted ? 1 : 0, { duration: 600 })),
    transform: [
      {
        translateY: withDelay(
          200,
          withTiming(mounted ? 0 : 20, {
            duration: 600,
            easing: Easing.out(Easing.cubic),
          })
        ),
      },
    ],
  }));

  const ctaStyle = useAnimatedStyle(() => ({
    opacity: withDelay(400, withTiming(mounted ? 1 : 0, { duration: 600 })),
    transform: [
      {
        translateY: withDelay(
          400,
          withTiming(mounted ? 0 : 20, {
            duration: 600,
          })
        ),
      },
    ],
  }));

  // Format price for display
  const getMonthlyPrice = () => monthlyPackage?.product.priceString || "$4.99";
  const getYearlyPrice = () => yearlyPackage?.product.priceString || "$39.99";
  const getYearlyMonthlyEquivalent = () => {
    if (yearlyPackage) {
      const yearlyPrice = yearlyPackage.product.price;
      const monthly = (yearlyPrice / 12).toFixed(2);
      return `${yearlyPackage.product.currencyCode === "EUR" ? "€" : "$"}${monthly}${t("paywall.pricing.perMonth")}`;
    }
    return "$3.33/month";
  };

  const selectedPackage = selectedPlan === "yearly" ? yearlyPackage : monthlyPackage;
  const introPrice = selectedPackage?.product.introPrice;

  // Build trial info text - show trial duration and then price
  const getTrialInfoText = () => {
    if (!selectedPackage) return null;

    if (introPrice) {
      // Has free trial - show trial period then price
      const trialDays = introPrice.periodNumberOfUnits || 7;
      const periodUnit = introPrice.periodUnit || "DAY";
      const trialPeriod = periodUnit === "DAY"
        ? t("paywall.trialDays", { count: trialDays })
        : t("paywall.trialWeeks", { count: trialDays });

      return t("paywall.trialInfo", {
        trialPeriod,
        price: selectedPackage.product.priceString
      });
    }

    // No trial - show direct pricing info
    return t("paywall.noTrialInfo", { price: selectedPackage.product.priceString });
  };

  const trialInfo = getTrialInfoText();

  return (
    <View className="flex-1 bg-surface">
      {/* Close button */}
      <Pressable
        onPress={handleClose}
        className="absolute top-0 right-0 z-10 p-4 active:opacity-50"
        style={{ marginTop: insets.top }}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <X size={28} color="#57534e" weight="bold" />
      </Pressable>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{
          paddingTop: insets.top + 16,
          paddingHorizontal: 24,
          paddingBottom: 280,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <Animated.View style={headerStyle} className="items-center mb-8">
          {/* Early Access Badge */}
          <View className="flex-row items-center gap-2 bg-forest-100 px-4 py-2 rounded-full mb-6">
            <Animated.View style={sparkleStyle}>
              <Sparkle size={16} color="#334d43" weight="fill" />
            </Animated.View>
            <Text className="text-primary text-sm font-semibold">
              {t("paywall.badge")}
            </Text>
          </View>

          {/* Title - Same style as welcome.tsx */}
          <View className="items-center">
            <Text
              className="font-serif text-5xl leading-[1.05] tracking-tight text-stone-800 text-center"
              style={{ fontFamily: "PlayfairDisplay_400Regular" }}
            >
              {t("paywall.headline")}
            </Text>
            <Text
              className="font-serif italic text-5xl leading-[1.05] tracking-tight text-primary text-center"
              style={{ fontFamily: "PlayfairDisplay_400Regular_Italic" }}
            >
              {t("paywall.headlineHighlight")}
            </Text>
          </View>

          {/* Subtitle */}
          <Text className="text-stone-500 text-base font-medium text-center mt-4">
            {t("paywall.subtitle")}
          </Text>
        </Animated.View>

        {/* Features Card */}
        <Animated.View
          style={contentStyle}
          className="bg-surface-elevated rounded-3xl p-6 mb-6 border border-border-light"
        >
          <View className="gap-5">
            <FeatureRow
              icon={InfinityIcon}
              title={t("paywall.features.unlimited.title")}
              description={t("paywall.features.unlimited.description")}
            />
            <FeatureRow
              icon={ChefHat}
              title={t("paywall.features.aiChef.title")}
              description={t("paywall.features.aiChef.description")}
            />
            <FeatureRow
              icon={Globe}
              title={t("paywall.features.translate.title")}
              description={t("paywall.features.translate.description")}
            />
            <FeatureRow
              icon={Sparkle}
              title={t("paywall.features.comingSoon.title")}
              description={t("paywall.features.comingSoon.description")}
              isComingSoon
            />
          </View>
        </Animated.View>

      </ScrollView>

      {/* Fixed Footer Section */}
      <Animated.View
        style={[
          ctaStyle,
          {
            paddingBottom: insets.bottom + 16,
          },
        ]}
        className="absolute bottom-0 left-0 right-0 bg-surface px-6 pt-4 border-t border-border-light"
      >
        {/* Pricing Cards in Footer */}
        <View className="flex-row gap-3 mb-4">
          {isLoading ? (
            <View className="flex-1 items-center justify-center py-4">
              <ActivityIndicator size="small" color="#c9a962" />
            </View>
          ) : (
            <>
              <PricingCard
                label={t("paywall.pricing.monthly")}
                price={getMonthlyPrice()}
                period={t("paywall.pricing.perMonth")}
                isSelected={selectedPlan === "monthly"}
                onSelect={() => setSelectedPlan("monthly")}
                variant="gold"
              />
              <PricingCard
                label={t("paywall.pricing.yearly")}
                price={getYearlyPrice()}
                period={t("paywall.pricing.perYear")}
                subtext={getYearlyMonthlyEquivalent()}
                badge={t("paywall.pricing.yearlyBadge")}
                isSelected={selectedPlan === "yearly"}
                onSelect={() => setSelectedPlan("yearly")}
                variant="gold"
              />
            </>
          )}
        </View>

        {/* CTA Button - Gold premium style */}
        <ActionButton
          title={t("paywall.cta")}
          onPress={handlePurchase}
          disabled={isPurchasing || isLoading}
          isLoading={isPurchasing}
          className="bg-premium"
          rightIcon={<ArrowRightIcon size={16} color="white" weight="bold" />}
        />

        {/* Trial info */}
        {trialInfo && (
          <Text className="text-stone-500 text-center text-sm mt-3">
            {trialInfo}
          </Text>
        )}

        {/* Footer links */}
        <View className="flex-row items-center justify-center gap-3 mt-4">
          <Pressable onPress={handleRestore} disabled={isRestoring}>
            {isRestoring ? (
              <ActivityIndicator size="small" color="#78716c" />
            ) : (
              <Text className="text-stone-400 text-xs">{t("paywall.restore")}</Text>
            )}
          </Pressable>
          <Text className="text-stone-300">•</Text>
          <Pressable onPress={() => Linking.openURL("https://cuisto.app/terms")}>
            <Text className="text-stone-400 text-xs underline">{t("paywall.terms")}</Text>
          </Pressable>
          <Text className="text-stone-300">•</Text>
          <Pressable onPress={() => Linking.openURL("https://cuisto.app/privacy")}>
            <Text className="text-stone-400 text-xs underline">{t("paywall.privacy")}</Text>
          </Pressable>
        </View>
      </Animated.View>

      {/* Toast for fullscreen modal - needs its own instance with high z-index */}
      <View style={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 100 }} pointerEvents="box-none">
        <Toast config={toastConfig} topOffset={insets.top} />
      </View>
    </View>
  );
}
