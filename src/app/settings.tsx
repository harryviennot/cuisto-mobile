import React, { useState, useCallback, useRef } from "react";
import {
    View,
    Text,
    ScrollView,
    Pressable,
    Alert,
    Linking,
    KeyboardAvoidingView,
    Platform,
} from "react-native";
import { Stack, router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import Constants from "expo-constants";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Haptics from "expo-haptics";
import Animated, { useSharedValue, useAnimatedScrollHandler } from "react-native-reanimated";
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
    CaretRightIcon,
    CheckIcon,
    LinkedinLogoIcon,
    ArrowLeftIcon,
} from "phosphor-react-native";
import { BottomSheetTextInput, BottomSheetModal, BottomSheetBackdrop } from "@gorhom/bottom-sheet";

import { useAuth } from "@/contexts/AuthContext";
import { authService } from "@/api/services/auth.service";
import { tokenManager } from "@/api/token-manager";
import { PageHeader } from "@/components/ui/PageHeader";
import { PremiumBottomSheet } from "@/components/ui/PremiumBottomSheet";
import { UnifiedStickyHeader } from "@/components/ui/UnifiedStickyHeader";

// ============================================================================
// Types
// ============================================================================

interface SettingsItem {
    id: string;
    icon: React.ReactNode;
    title: string;
    description?: string;
    onPress: () => void;
    variant?: "default" | "destructive";
    rightText?: string;
}

// ============================================================================
// Settings Screen
// ============================================================================

export default function SettingsScreen() {
    const { t, i18n } = useTranslation();
    const insets = useSafeAreaInsets();
    const { user, signOut } = useAuth();

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

    // State
    const [newEmail, setNewEmail] = useState("");
    const [isSubmittingEmail, setIsSubmittingEmail] = useState(false);

    const appVersion = Constants.expoConfig?.version || "1.0.0";

    // ============================================================================
    // Handlers
    // ============================================================================

    const handleBack = useCallback(() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        router.back();
    }, []);

    const handleLanguageChange = useCallback(
        async (lang: string) => {
            Haptics.selectionAsync();
            await i18n.changeLanguage(lang);
            await AsyncStorage.setItem("user-language", lang);
            languageSheetRef.current?.dismiss();
        },
        [i18n]
    );

    const handleEmailSubmit = useCallback(async () => {
        if (!newEmail.trim()) return;

        setIsSubmittingEmail(true);
        try {
            await authService.changeEmail(newEmail.trim());
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            Alert.alert(
                t("settings.changeEmail.successTitle"),
                t("settings.changeEmail.successMessage")
            );
            emailSheetRef.current?.dismiss();
            setNewEmail("");
        } catch (error: any) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            Alert.alert(
                t("common.error"),
                error?.response?.data?.detail || t("settings.changeEmail.errorAlreadyUsed")
            );
        } finally {
            setIsSubmittingEmail(false);
        }
    }, [newEmail, t]);

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
                    router.replace("/welcome");
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
                            await authService.deleteAccount();
                            await tokenManager.clearTokens();
                            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                            Alert.alert(t("common.success"), t("settings.deleteAccount.successMessage"));
                            router.replace("/welcome");
                        } catch (error: any) {
                            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
                            Alert.alert(t("common.error"), error?.response?.data?.detail || t("common.error"));
                        }
                    },
                },
            ]
        );
    }, [t]);

    const handleLinkedIn = useCallback(() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        Linking.openURL("https://www.linkedin.com/in/harryfabre/");
    }, []);

    // ============================================================================
    // Bottom Sheet Backdrop (Standard for Sheets)
    // ============================================================================

    const renderBackdrop = useCallback(
        (props: React.ComponentProps<typeof BottomSheetBackdrop>) => (
            <BottomSheetBackdrop
                {...props}
                disappearsOnIndex={-1}
                appearsOnIndex={0}
                opacity={0.3}
                pressBehavior="close"
            />
        ),
        []
    );

    // ============================================================================
    // Menu Items
    // ============================================================================

    const accountItems: SettingsItem[] = [
        {
            id: "language",
            icon: <GlobeIcon size={24} color="#334d43" weight="fill" />,
            title: t("settings.language.title"),
            description: i18n.language === "en" ? "English" : "Français",
            onPress: () => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                languageSheetRef.current?.present();
            },
        },
        {
            id: "changeEmail",
            icon: <EnvelopeIcon size={24} color="#334d43" weight="fill" />,
            title: t("settings.changeEmail.title"),
            description: user?.email || "",
            onPress: () => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                emailSheetRef.current?.present();
            },
        },
        {
            id: "subscription",
            icon: <CreditCardIcon size={24} color="#334d43" weight="fill" />,
            title: t("settings.subscription.title"),
            description: t("settings.subscription.comingSoon"),
            onPress: () => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                // Placeholder - subscription not implemented yet
            },
        },
    ];

    const appItems: SettingsItem[] = [
        {
            id: "feedback",
            icon: <ChatCircleDotsIcon size={24} color="#334d43" weight="fill" />,
            title: t("settings.feedback.title"),
            description: t("settings.feedback.description"),
            onPress: handleFeedback,
        },
        {
            id: "privacy",
            icon: <ShieldCheckIcon size={24} color="#334d43" weight="fill" />,
            title: t("settings.privacyPolicy.title"),
            onPress: handlePrivacyPolicy,
        },
        {
            id: "terms",
            icon: <FileTextIcon size={24} color="#334d43" weight="fill" />,
            title: t("settings.termsOfService.title"),
            onPress: handleTermsOfService,
        },
        {
            id: "about",
            icon: <InfoIcon size={24} color="#334d43" weight="fill" />,
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
            icon: <SignOutIcon size={24} color="#334d43" weight="fill" />,
            title: t("settings.logout.title"),
            onPress: handleLogout,
        },
        {
            id: "delete",
            icon: <TrashIcon size={24} color="#c65d47" weight="fill" />,
            title: t("settings.deleteAccount.title"),
            description: t("settings.deleteAccount.description"),
            onPress: handleDeleteAccount,
            variant: "destructive",
        },
    ];

    // ============================================================================
    // Render Menu Item
    // ============================================================================

    const renderMenuItem = (item: SettingsItem, isLast: boolean) => (
        <Pressable
            key={item.id}
            onPress={item.onPress}
            className={`flex-row items-center px-5 py-4 active:bg-surface-elevated ${!isLast ? "border-b border-border-light" : ""
                }`}
        >
            <View
                className={`w-10 h-10 items-center justify-center rounded-xl bg-primary/10`}
            >
                {item.icon}
            </View>
            <View className="flex-1 ml-4">
                <Text
                    className={`text-base font-medium ${item.variant === "destructive" ? "text-state-error" : "text-foreground-heading"
                        }`}
                >
                    {item.title}
                </Text>
                {item.description && (
                    <Text className="text-sm text-foreground-muted mt-0.5" numberOfLines={1}>
                        {item.description}
                    </Text>
                )}
            </View>
            <CaretRightIcon size={20} color="#9a8b7a" />
        </Pressable>
    );

    // ============================================================================
    // Render
    // ============================================================================

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
                onBackPress={handleBack}
            />

            <Animated.ScrollView
                className="flex-1"
                contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}
                showsVerticalScrollIndicator={false}
                onScroll={scrollHandler}
                scrollEventThrottle={16}
            >
                {/* Header (Standard PageHeader with padding for Sticky Header) */}
                <PageHeader
                    subtitle={t("settings.subtitle")}
                    title={t("settings.title")}
                    topPadding={insets.top + 60} // Add space for sticky header logic if needed or visual consistency
                />

                {/* Account Section */}
                <View className="mb-6">
                    <Text className="px-5 py-2 text-xs font-bold uppercase tracking-wider text-foreground-tertiary">
                        {t("settings.sections.account")}
                    </Text>
                    <View className="bg-surface rounded-2xl mx-4 overflow-hidden border border-border-light shadow-sm">
                        {accountItems.map((item, index) =>
                            renderMenuItem(item, index === accountItems.length - 1)
                        )}
                    </View>
                </View>

                {/* App Section */}
                <View className="mb-6">
                    <Text className="px-5 py-2 text-xs font-bold uppercase tracking-wider text-foreground-tertiary">
                        {t("settings.sections.app")}
                    </Text>
                    <View className="bg-surface rounded-2xl mx-4 overflow-hidden border border-border-light shadow-sm">
                        {appItems.map((item, index) => renderMenuItem(item, index === appItems.length - 1))}
                    </View>
                </View>

                {/* Danger Zone */}
                <View className="mb-6">
                    <Text className="px-5 py-2 text-xs font-bold uppercase tracking-wider text-state-error">
                        {t("settings.sections.dangerZone")}
                    </Text>
                    <View className="bg-surface rounded-2xl mx-4 overflow-hidden border border-state-error/20 shadow-sm">
                        {dangerItems.map((item, index) =>
                            renderMenuItem(item, index === dangerItems.length - 1)
                        )}
                    </View>
                </View>

                {/* App Version */}
                <Text className="text-center text-sm text-foreground-muted mt-4">
                    {t("settings.appVersion", { version: appVersion })}
                </Text>
            </Animated.ScrollView>

            {/* ================================================================== */}
            {/* Language Bottom Sheet */}
            {/* ================================================================== */}
            <PremiumBottomSheet
                ref={languageSheetRef}
                snapPoints={["45%"]}
                title={t("settings.language.selectLanguage")}
                subtitle={t("settings.language.subtitle", "Applications Settings")}
                backdropComponent={renderBackdrop}
                onClose={() => languageSheetRef.current?.dismiss()}
            >
                <View className="px-6 pb-8">
                    {/* English */}
                    <Pressable
                        onPress={() => handleLanguageChange("en")}
                        className="flex-row items-center py-4 px-4 rounded-xl mb-2 active:bg-surface-elevated"
                        style={{
                            backgroundColor: i18n.language === "en" ? "bg-surface-elevated" : "transparent",
                        }}
                    >
                        <Text className="flex-1 text-base text-foreground-heading font-medium">English</Text>
                        {i18n.language === "en" && <CheckIcon size={24} color="#334d43" weight="bold" />}
                    </Pressable>

                    {/* French */}
                    <Pressable
                        onPress={() => handleLanguageChange("fr")}
                        className="flex-row items-center py-4 px-4 rounded-xl active:bg-surface-elevated"
                        style={{
                            backgroundColor: i18n.language === "fr" ? "bg-surface-elevated" : "transparent",
                        }}
                    >
                        <Text className="flex-1 text-base text-foreground-heading font-medium">Français</Text>
                        {i18n.language === "fr" && <CheckIcon size={24} color="#334d43" weight="bold" />}
                    </Pressable>
                </View>
            </PremiumBottomSheet>

            {/* ================================================================== */}
            {/* Email Change Bottom Sheet */}
            {/* ================================================================== */}
            <PremiumBottomSheet
                ref={emailSheetRef}
                snapPoints={["60%", "85%"]}
                title={t("settings.changeEmail.title")}
                subtitle={t("settings.sections.account").toUpperCase()}
                backdropComponent={renderBackdrop}
                onClose={() => emailSheetRef.current?.dismiss()}
            >
                <KeyboardAvoidingView
                    behavior={Platform.OS === "ios" ? "padding" : "height"}
                    style={{ flex: 1 }}
                >
                    <View className="px-6 pb-8">
                        <Text className="text-sm font-medium text-foreground-heading mb-2 ml-1">
                            {t("settings.changeEmail.inputLabel")}
                        </Text>
                        <BottomSheetTextInput
                            value={newEmail}
                            onChangeText={setNewEmail}
                            placeholder={t("settings.changeEmail.inputPlaceholder")}
                            placeholderTextColor="#9a8b7a"
                            keyboardType="email-address"
                            autoCapitalize="none"
                            autoCorrect={false}
                            className="w-full px-4 py-4 rounded-xl border border-border-light bg-surface-elevated text-foreground-heading text-base mb-6"
                            style={{ fontFamily: "System" }}
                        />

                        <Pressable
                            onPress={handleEmailSubmit}
                            disabled={isSubmittingEmail || !newEmail.trim()}
                            className={`w-full py-4 rounded-full items-center justify-center ${isSubmittingEmail || !newEmail.trim() ? "bg-primary-disabled" : "bg-primary"
                                }`}
                        >
                            <Text
                                className={`text-base font-bold tracking-wide ${isSubmittingEmail || !newEmail.trim() ? "text-primary-disabled-foreground" : "text-primary-foreground"
                                    }`}
                            >
                                {isSubmittingEmail ? t("common.loading") : t("settings.changeEmail.submitButton")}
                            </Text>
                        </Pressable>
                    </View>
                </KeyboardAvoidingView>
            </PremiumBottomSheet>

            {/* ================================================================== */}
            {/* About Bottom Sheet */}
            {/* ================================================================== */}
            <PremiumBottomSheet
                ref={aboutSheetRef}
                snapPoints={["60%", "85%"]}
                title={t("settings.about.sheetTitle")}
                subtitle={`VERSION ${appVersion}`}
                backdropComponent={renderBackdrop}
                onClose={() => aboutSheetRef.current?.dismiss()}
            >
                <ScrollView className="px-6 pb-8" showsVerticalScrollIndicator={false}>
                    <Text className="text-base text-foreground-heading leading-relaxed font-medium">
                        {t("settings.about.story")}
                    </Text>

                    <Text className="text-sm text-foreground-muted mt-8 text-center italic">
                        {t("settings.about.madeBy")}
                    </Text>

                    {/* Social Links */}
                    <View className="mt-8 mb-8">
                        <Text className="text-xs font-bold uppercase tracking-wider text-foreground-tertiary mb-4 text-center">
                            {t("settings.about.connect")}
                        </Text>
                        <Pressable
                            onPress={handleLinkedIn}
                            className="flex-row items-center justify-center py-3 px-6 rounded-full bg-[#0077B5]/20 active:bg-[#0077B5]/30 self-center"
                        >
                            <LinkedinLogoIcon size={24} color="#0077B5" weight="fill" />
                            <Text className="ml-2 text-base font-medium text-[#0077B5]">LinkedIn</Text>
                        </Pressable>
                    </View>
                </ScrollView>
            </PremiumBottomSheet>
        </View>
    );
}
