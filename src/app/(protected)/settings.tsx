import React, { useCallback, useRef, useState } from "react";
import { View, Text, Alert, Linking, Pressable } from "react-native";
import { Stack, router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import Constants from "expo-constants";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Haptics from "expo-haptics";
import Animated, { useSharedValue, useAnimatedScrollHandler } from "react-native-reanimated";
import { BottomSheetModal } from "@gorhom/bottom-sheet";
import * as Sentry from "@sentry/react-native";
import {
  GlobeIcon,
  EnvelopeIcon,
  CreditCardIcon,
  ChatCircleDotsIcon,
  ShieldCheckIcon,
  FileTextIcon,
  InfoIcon,
  SignOutIcon,
  TrashIcon,
  Gift,
} from "phosphor-react-native";

import { useAuth } from "@/contexts/AuthContext";
import { authService } from "@/api/services/auth.service";
import { PageHeader } from "@/components/ui/PageHeader";
import { UnifiedStickyHeader } from "@/components/ui/UnifiedStickyHeader";
import {
  SettingsItem,
  SettingsSection,
  LanguageBottomSheet,
  ChangeEmailBottomSheet,
  AboutBottomSheet,
  ReferralBottomSheet,
  SubscriptionBottomSheet,
} from "@/components/settings";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { PremiumPlanCard } from "@/components/credits";
import { PremiumSuccessScreen } from "@/components/paywall/PremiumSuccessScreen";

export default function SettingsScreen() {
  const { t, i18n } = useTranslation();
  const insets = useSafeAreaInsets();
  const { user, signOut } = useAuth();
  const { isPremium, isTrialing, subscriptionExpiresAt } = useSubscription();

  // DEV ONLY: Triple-tap on version to show success screen
  const [showDevSuccess, setShowDevSuccess] = useState(false);
  const [devTapCount, setDevTapCount] = useState(0);
  const devTapTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleVersionTap = () => {
    if (!__DEV__) return;

    if (devTapTimeout.current) {
      clearTimeout(devTapTimeout.current);
    }

    const newCount = devTapCount + 1;
    setDevTapCount(newCount);

    if (newCount >= 3) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setShowDevSuccess(true);
      setDevTapCount(0);
    } else {
      devTapTimeout.current = setTimeout(() => {
        setDevTapCount(0);
      }, 500);
    }
  };

  // Animations
  const scrollY = useSharedValue(0);
  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
    },
  });

  // Bottom sheet refs
  const languageSheetRef = useRef<BottomSheetModal>(null);
  const emailSheetRef = useRef<BottomSheetModal>(null);
  const aboutSheetRef = useRef<BottomSheetModal>(null);
  const referralSheetRef = useRef<BottomSheetModal>(null);
  const subscriptionSheetRef = useRef<BottomSheetModal>(null);

  const appVersion = Constants.expoConfig?.version || "1.0.7";

  // ============================================================================
  // Handlers
  // ============================================================================

  const handleLanguageChange = useCallback(
    async (lang: string) => {
      Haptics.selectionAsync();
      await i18n.changeLanguage(lang);
      await AsyncStorage.setItem("user-language", lang);
      languageSheetRef.current?.dismiss();
    },
    [i18n]
  );

  const handleFeedback = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Linking.openURL("mailto:harry@cuisto.app?subject=Cuistudio%20Feedback");
  }, []);

  const handlePrivacyPolicy = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Linking.openURL("https://cuisto.app/privacy");
  }, []);

  const handleTermsOfService = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Linking.openURL("https://cuisto.app/terms");
  }, []);

  const handleLogout = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert(t("settings.logout.confirmTitle"), t("settings.logout.confirmMessage"), [
      { text: t("common.cancel"), style: "cancel" },
      {
        text: t("settings.logout.confirmButton"),
        style: "destructive",
        onPress: async () => {
          await signOut();
        },
      },
    ]);
  }, [signOut, t]);

  const handleDeleteAccount = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    Alert.alert(
      t("settings.deleteAccount.confirmTitle"),
      t("settings.deleteAccount.confirmMessage"),
      [
        { text: t("common.cancel"), style: "cancel" },
        {
          text: t("settings.deleteAccount.confirmButton"),
          style: "destructive",
          onPress: async () => {
            try {
              // Delete account on backend first
              await authService.deleteAccount();
              // Then sign out (skip backend logout since account is already deleted)
              await signOut({ skipBackendLogout: true });
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              Alert.alert(t("common.success"), t("settings.deleteAccount.successMessage"));
            } catch (error: unknown) {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
              const errorMessage =
                (error as { response?: { data?: { detail?: string } } })?.response?.data?.detail ||
                t("common.error");
              Alert.alert(t("common.error"), errorMessage);
            }
          },
        },
      ]
    );
  }, [t, signOut]);

  const handleLinkedIn = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Linking.openURL("https://www.linkedin.com/in/harry-viennot/");
  }, []);

  // ============================================================================
  // Menu Items
  // ============================================================================

  const getSubscriptionDescription = () => {
    if (isPremium) {
      return isTrialing
        ? t("settings.subscription.trial")
        : t("settings.subscription.premium");
    }
    return t("settings.subscription.free");
  };

  const accountItems: SettingsItem[] = [
    {
      id: "language",
      icon: <GlobeIcon size={24} color="white" weight="fill" />,
      title: t("settings.language.title"),
      description: i18n.language === "en" ? "English" : "Français",
      onPress: () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        languageSheetRef.current?.present();
      },
    },
    {
      id: "changeEmail",
      icon: <EnvelopeIcon size={24} color="white" weight="fill" />,
      title: t("settings.changeEmail.title"),
      description: user?.email || "",
      onPress: () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        emailSheetRef.current?.present();
      },
    },
    {
      id: "subscription",
      icon: <CreditCardIcon size={24} color="white" weight="fill" />,
      title: t("settings.subscription.title"),
      description: getSubscriptionDescription(),
      onPress: () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        subscriptionSheetRef.current?.present();
      },
    },
    {
      id: "referral",
      icon: <Gift size={24} color="white" weight="fill" />,
      title: t("settings.referral.title"),
      description: t("settings.referral.description"),
      onPress: () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        referralSheetRef.current?.present();
      },
    },
  ];

  const appItems: SettingsItem[] = [
    {
      id: "feedback",
      icon: <ChatCircleDotsIcon size={24} color="white" weight="fill" />,
      title: t("settings.feedback.title"),
      description: t("settings.feedback.description"),
      onPress: handleFeedback,
    },
    {
      id: "privacy",
      icon: <ShieldCheckIcon size={24} color="white" weight="fill" />,
      title: t("settings.privacyPolicy.title"),
      onPress: handlePrivacyPolicy,
    },
    {
      id: "terms",
      icon: <FileTextIcon size={24} color="white" weight="fill" />,
      title: t("settings.termsOfService.title"),
      onPress: handleTermsOfService,
    },
    {
      id: "about",
      icon: <InfoIcon size={24} color="white" weight="fill" />,
      title: t("settings.about.title"),
      description: t("settings.about.description"),
      onPress: () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        aboutSheetRef.current?.present();
      },
    },
  ];

  const dangerItems: SettingsItem[] = [
    {
      id: "logout",
      icon: <SignOutIcon size={24} color="white" weight="fill" />,
      title: t("settings.logout.title"),
      onPress: handleLogout,
    },
    {
      id: "delete",
      icon: <TrashIcon size={24} color="white" weight="fill" />,
      title: t("settings.deleteAccount.title"),
      description: t("settings.deleteAccount.description"),
      onPress: handleDeleteAccount,
      variant: "destructive",
    },
  ];

  // ============================================================================
  // Render
  // ============================================================================

  // DEV ONLY: Show success screen for testing
  if (showDevSuccess) {
    return <PremiumSuccessScreen onContinue={() => setShowDevSuccess(false)} />;
  }

  return (
    <View className="flex-1 bg-surface">
      <Stack.Screen
        options={{
          headerShown: false,
          presentation: "card",
        }}
      />

      <UnifiedStickyHeader
        title={t("settings.title")}
        scrollY={scrollY}
        onBackPress={() => router.back()}
      />

      <Animated.ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: insets.bottom }}
        showsVerticalScrollIndicator={false}
        onScroll={scrollHandler}
        scrollEventThrottle={16}
      >
        <PageHeader
          subtitle={t("settings.subtitle")}
          title={t("settings.title")}
          topPadding={insets.top + 60}
        />

        {isPremium && (
          <PremiumPlanCard isTrialing={isTrialing} subscriptionExpiresAt={subscriptionExpiresAt} className="mx-5 mb-4" onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            subscriptionSheetRef.current?.present();
          }} />
        )}

        <SettingsSection title={t("settings.sections.account")} items={accountItems} />

        <SettingsSection title={t("settings.sections.app")} items={appItems} />

        <SettingsSection
          title={t("settings.sections.dangerZone")}
          items={dangerItems}
          variant="danger"
        />

        <Pressable onPress={handleVersionTap}>
          <Text className="text-center text-sm text-foreground-muted mt-4">
            {t("settings.appVersion", { version: appVersion })}
          </Text>
        </Pressable>
      </Animated.ScrollView>

      <LanguageBottomSheet
        ref={languageSheetRef}
        currentLanguage={i18n.language}
        onLanguageChange={handleLanguageChange}
      />

      <ChangeEmailBottomSheet ref={emailSheetRef} />

      <AboutBottomSheet ref={aboutSheetRef} onLinkedInPress={handleLinkedIn} />

      <ReferralBottomSheet ref={referralSheetRef} />

      <SubscriptionBottomSheet ref={subscriptionSheetRef} />
    </View>
  );
}
