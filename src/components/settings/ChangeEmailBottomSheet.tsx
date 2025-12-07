import React, { forwardRef, useState, useCallback } from "react";
import { View, Text, Pressable, KeyboardAvoidingView, Platform, Alert } from "react-native";
import { BottomSheetModal, BottomSheetTextInput } from "@gorhom/bottom-sheet";
import { useTranslation } from "react-i18next";
import * as Haptics from "expo-haptics";

import { PremiumBottomSheet } from "@/components/ui/PremiumBottomSheet";
import { authService } from "@/api/services/auth.service";

export const ChangeEmailBottomSheet = forwardRef<BottomSheetModal>(
  function ChangeEmailBottomSheet(_props, ref) {
    const { t } = useTranslation();
    const [newEmail, setNewEmail] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleDismiss = useCallback(() => {
      if (ref && "current" in ref && ref.current) {
        ref.current.dismiss();
      }
    }, [ref]);

    const handleSubmit = useCallback(async () => {
      if (!newEmail.trim()) return;

      setIsSubmitting(true);
      try {
        await authService.changeEmail(newEmail.trim());
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Alert.alert(
          t("settings.changeEmail.successTitle"),
          t("settings.changeEmail.successMessage")
        );
        handleDismiss();
        setNewEmail("");
      } catch (error: unknown) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        const errorMessage =
          (error as { response?: { data?: { detail?: string } } })?.response?.data
            ?.detail || t("settings.changeEmail.errorAlreadyUsed");
        Alert.alert(t("common.error"), errorMessage);
      } finally {
        setIsSubmitting(false);
      }
    }, [newEmail, t, handleDismiss]);

    return (
      <PremiumBottomSheet
        ref={ref}
        snapPoints={["60%", "85%"]}
        title={t("settings.changeEmail.title")}
        subtitle={t("settings.sections.account").toUpperCase()}
        onClose={handleDismiss}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={{ flex: 1 }}
        >
          <View className="px-6 pb-8 pt-2">
            <Text className="text-base text-foreground-muted mb-6 leading-relaxed">
              {t(
                "settings.changeEmail.description",
                "Update your email address to ensure you receive important account notifications."
              )}
            </Text>

            <View className="mb-6">
              <Text className="text-xs font-bold uppercase tracking-wider text-foreground-tertiary mb-2 ml-1">
                {t("settings.changeEmail.inputLabel")}
              </Text>
              <BottomSheetTextInput
                value={newEmail}
                onChangeText={setNewEmail}
                placeholder={t("settings.changeEmail.inputPlaceholder")}
                placeholderTextColor="#9CA3AF"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                className="w-full px-5 py-4 rounded-xl bg-surface-elevated text-foreground-heading text-lg font-medium border border-transparent focus:border-primary/50 focus:bg-surface transition-all"
                style={{ fontFamily: "System" }}
              />
            </View>

            <Pressable
              onPress={handleSubmit}
              disabled={isSubmitting || !newEmail.trim()}
              className={`w-full py-4 rounded-xl items-center justify-center shadow-sm ${
                isSubmitting || !newEmail.trim()
                  ? "bg-surface-disabled"
                  : "bg-primary active:bg-primary-dark"
              }`}
            >
              <Text
                className={`text-base font-bold tracking-wide ${
                  isSubmitting || !newEmail.trim()
                    ? "text-foreground-disabled"
                    : "text-white"
                }`}
              >
                {isSubmitting
                  ? t("common.loading")
                  : t("settings.changeEmail.submitButton")}
              </Text>
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      </PremiumBottomSheet>
    );
  }
);
