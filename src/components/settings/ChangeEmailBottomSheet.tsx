import React, { forwardRef, useState, useCallback, useRef } from "react";
import { View, Text, Pressable } from "react-native";
import { BottomSheetModal, BottomSheetTextInput } from "@gorhom/bottom-sheet";
import { useTranslation } from "react-i18next";
import * as Haptics from "expo-haptics";
import Toast from "react-native-toast-message";

import { PremiumBottomSheet } from "@/components/ui/PremiumBottomSheet";
import { ActionButton } from "@/components/ui/ActionButton";
import {
  OTPInputField,
  OTPInputFieldRef,
} from "@/components/forms/OTPInputField";
import { authService } from "@/api/services/auth.service";
import { useAuth } from "@/contexts/AuthContext";

type Step = "email" | "otp_current" | "otp_new";

interface ApiError {
  response?: {
    status?: number;
    data?: { detail?: string };
  };
}

export const ChangeEmailBottomSheet = forwardRef<BottomSheetModal>(
  function ChangeEmailBottomSheet(_props, ref) {
    const { t } = useTranslation();
    const { user, refreshUser } = useAuth();

    /**
     * Translates backend error messages to localized strings
     */
    const getTranslatedError = useCallback(
      (error: unknown): string => {
        const apiError = error as ApiError;
        const detail = apiError?.response?.data?.detail || "";
        const statusCode = apiError?.response?.status;

        // Rate limit error (429)
        if (statusCode === 429 || detail.toLowerCase().includes("wait")) {
          const match = detail.match(/(\d+)\s*seconds?/i);
          const seconds = match ? match[1] : "30";
          return t("settings.changeEmail.errorRateLimit", { seconds });
        }

        // Duplicate email error
        if (
          detail.toLowerCase().includes("already registered") ||
          detail.toLowerCase().includes("already exists")
        ) {
          return t("settings.changeEmail.errorAlreadyUsed");
        }

        // Invalid/expired OTP
        if (
          detail.toLowerCase().includes("invalid") ||
          detail.toLowerCase().includes("expired")
        ) {
          return t("settings.changeEmail.invalidCode");
        }

        // No email on account
        if (detail.toLowerCase().includes("no email")) {
          return t("settings.changeEmail.errorNoEmail");
        }

        // Generic fallback
        return t("settings.changeEmail.errorGeneric");
      },
      [t]
    );
    const [step, setStep] = useState<Step>("email");
    const [newEmail, setNewEmail] = useState("");
    const [otpCode, setOtpCode] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [otpError, setOtpError] = useState("");
    const otpInputRef = useRef<OTPInputFieldRef>(null);

    const handleDismiss = useCallback(() => {
      if (ref && "current" in ref && ref.current) {
        ref.current.dismiss();
      }
      // Reset state after a delay to avoid UI flash
      setTimeout(() => {
        setStep("email");
        setNewEmail("");
        setOtpCode("");
        setOtpError("");
      }, 300);
    }, [ref]);

    const handleSendOTP = useCallback(async () => {
      if (!newEmail.trim()) return;

      setIsSubmitting(true);
      try {
        await authService.changeEmail(newEmail.trim());
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setStep("otp_current");
        // Focus OTP input after transition
        setTimeout(() => otpInputRef.current?.focus(), 100);
      } catch (error: unknown) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        Toast.show({
          type: "error",
          text1: t("common.error"),
          text2: getTranslatedError(error),
        });
      } finally {
        setIsSubmitting(false);
      }
    }, [newEmail, t, getTranslatedError]);

    const handleVerifyOTP = useCallback(async () => {
      if (otpCode.length !== 6) return;

      setIsSubmitting(true);
      setOtpError("");
      try {
        const response = await authService.verifyEmailChange(newEmail.trim(), otpCode);

        // Check if this was the first OTP (current email) and a second OTP was sent
        if (response.message === "SECOND_OTP_SENT") {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          setOtpCode("");
          setStep("otp_new");
          // Focus OTP input after transition
          setTimeout(() => otpInputRef.current?.focus(), 100);
          return;
        }

        // Email change complete - refresh user data to get updated email
        await refreshUser();
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Toast.show({
          type: "success",
          text1: t("settings.changeEmail.successTitle"),
          text2: t("settings.changeEmail.successMessage"),
        });
        handleDismiss();
      } catch (error: unknown) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        setOtpError(getTranslatedError(error));
      } finally {
        setIsSubmitting(false);
      }
    }, [otpCode, newEmail, t, handleDismiss, refreshUser, getTranslatedError]);

    const handleResendCode = useCallback(async () => {
      setIsSubmitting(true);
      setOtpError("");
      setOtpCode("");
      try {
        await authService.changeEmail(newEmail.trim());
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Toast.show({
          type: "success",
          text1: t("settings.changeEmail.otpSent"),
          text2: t("settings.changeEmail.otpResent"),
        });
      } catch (error: unknown) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        Toast.show({
          type: "error",
          text1: t("common.error"),
          text2: getTranslatedError(error),
        });
      } finally {
        setIsSubmitting(false);
      }
    }, [newEmail, t, getTranslatedError]);

    const handleBackToEmail = useCallback(() => {
      // If on the second OTP step, go back to first OTP step
      // Otherwise go back to email input
      if (step === "otp_new") {
        setStep("otp_current");
      } else {
        setStep("email");
      }
      setOtpCode("");
      setOtpError("");
    }, [step]);

    const handleOtpChange = useCallback((code: string) => {
      setOtpCode(code.replace(/[^0-9]/g, ""));
      setOtpError("");
    }, []);

    const getTitle = () => {
      if (step === "email") return t("settings.changeEmail.title");
      if (step === "otp_current") return t("settings.changeEmail.otpTitleCurrent");
      return t("settings.changeEmail.otpTitleNew");
    };

    const getSubtitle = () => {
      if (step === "email") return t("settings.changeEmail.subtitle").toUpperCase();
      if (step === "otp_current") return t("settings.changeEmail.verifyCurrentSubtitle").toUpperCase();
      return t("settings.changeEmail.verifyNewSubtitle").toUpperCase();
    };

    const getOtpInstructions = () => {
      if (step === "otp_current") {
        return t("settings.changeEmail.otpInstructionsCurrent", { email: user?.email });
      }
      return t("settings.changeEmail.otpInstructionsNew", { email: newEmail });
    };

    return (
      <PremiumBottomSheet
        ref={ref}
        title={getTitle()}
        subtitle={getSubtitle()}
        onClose={handleDismiss}
        snapPoints={["50%", "80%"]}
        keyboardBehavior="extend"
        keyboardBlurBehavior="restore"
        android_keyboardInputMode="adjustResize"
      >
        <View className="px-6 pb-8 pt-2">
          {step === "email" ? (
            <>
              <Text className="text-base text-foreground-muted mb-6 leading-relaxed">
                {t("settings.changeEmail.description")}
              </Text>

              <View className="mb-6">
                <Text className="font-bold shrink-0 text-sm uppercase tracking-widest text-foreground-tertiary mb-2">
                  {t("settings.changeEmail.inputLabel")}
                </Text>
                <BottomSheetTextInput
                  value={newEmail}
                  onChangeText={setNewEmail}
                  placeholder={t("settings.changeEmail.inputPlaceholder")}
                  placeholderTextColor="#a89f8d"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoComplete="email"
                  returnKeyType="done"
                  onSubmitEditing={handleSendOTP}
                  className="rounded-xl border border-border-button bg-white px-4 py-3.5 text-base text-foreground"
                />
              </View>

              <ActionButton
                title={
                  isSubmitting
                    ? t("common.loading")
                    : t("settings.changeEmail.sendCodeButton")
                }
                onPress={handleSendOTP}
                isLoading={isSubmitting}
                disabled={!newEmail.trim()}
                variant="primary"
              />
            </>
          ) : (
            <>
              {/* Step indicator - same style as auth screen */}
              <View className="flex-row justify-center items-center mb-6 gap-2">
                <View
                  className={`h-2 rounded-full ${step === "otp_current" ? "w-6 bg-primary" : "w-2 bg-primary/30"}`}
                />
                <View
                  className={`h-2 rounded-full ${step === "otp_new" ? "w-6 bg-primary" : "w-2 bg-primary/30"}`}
                />
              </View>

              <Text className="text-base text-foreground-muted mb-6 leading-relaxed">
                {getOtpInstructions()}
              </Text>

              <OTPInputField
                ref={otpInputRef}
                otpCode={otpCode}
                setOtpCode={handleOtpChange}
                maxInputLength={6}
                error={otpError}
                variant="light"
                autoFocus
                className="mb-4"
              />

              <ActionButton
                title={
                  isSubmitting
                    ? t("common.loading")
                    : step === "otp_current"
                      ? t("settings.changeEmail.verifyCurrentButton")
                      : t("settings.changeEmail.verifyNewButton")
                }
                onPress={handleVerifyOTP}
                isLoading={isSubmitting}
                disabled={otpCode.length !== 6}
                variant="primary"
              />

              <View className="flex-row justify-center items-center mt-4 gap-4">
                <Pressable onPress={handleBackToEmail} disabled={isSubmitting}>
                  <Text className="text-primary text-base">
                    {step === "otp_new"
                      ? t("common.back")
                      : t("settings.changeEmail.changeEmail")}
                  </Text>
                </Pressable>
                {step === "otp_current" && (
                  <>
                    <Text className="text-foreground-tertiary">•</Text>
                    <Pressable onPress={handleResendCode} disabled={isSubmitting}>
                      <Text className="text-primary text-base">
                        {t("settings.changeEmail.resendCode")}
                      </Text>
                    </Pressable>
                  </>
                )}
              </View>
            </>
          )}
        </View>
      </PremiumBottomSheet>
    );
  }
);
