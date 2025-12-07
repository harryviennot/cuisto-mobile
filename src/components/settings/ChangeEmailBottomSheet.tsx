import React, { forwardRef, useState, useCallback, useRef } from "react";
import { View, Text, Alert, Pressable, TextInput } from "react-native";
import { BottomSheetModal, BottomSheetTextInput } from "@gorhom/bottom-sheet";
import { useTranslation } from "react-i18next";
import * as Haptics from "expo-haptics";

import { PremiumBottomSheet } from "@/components/ui/PremiumBottomSheet";
import { ActionButton } from "@/components/ui/ActionButton";
import { authService } from "@/api/services/auth.service";

type Step = "email" | "otp_current" | "otp_new";

export const ChangeEmailBottomSheet = forwardRef<BottomSheetModal>(
  function ChangeEmailBottomSheet(_props, ref) {
    const { t } = useTranslation();
    const [step, setStep] = useState<Step>("email");
    const [newEmail, setNewEmail] = useState("");
    const [otpCode, setOtpCode] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [otpError, setOtpError] = useState("");
    const otpInputRef = useRef<TextInput>(null);

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
        const errorMessage =
          (error as { response?: { data?: { detail?: string } } })?.response?.data
            ?.detail || t("settings.changeEmail.errorAlreadyUsed");
        Alert.alert(t("common.error"), errorMessage);
      } finally {
        setIsSubmitting(false);
      }
    }, [newEmail, t]);

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

        // Email change complete
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Alert.alert(
          t("settings.changeEmail.successTitle"),
          t("settings.changeEmail.successMessage")
        );
        handleDismiss();
      } catch (error: unknown) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        const errorMessage =
          (error as { response?: { data?: { detail?: string } } })?.response?.data
            ?.detail || t("settings.changeEmail.invalidCode");
        setOtpError(errorMessage);
      } finally {
        setIsSubmitting(false);
      }
    }, [otpCode, newEmail, t, handleDismiss]);

    const handleResendCode = useCallback(async () => {
      setIsSubmitting(true);
      setOtpError("");
      setOtpCode("");
      try {
        await authService.changeEmail(newEmail.trim());
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Alert.alert(
          t("settings.changeEmail.otpSent"),
          t("settings.changeEmail.otpResent")
        );
      } catch (error: unknown) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        const errorMessage =
          (error as { response?: { data?: { detail?: string } } })?.response?.data
            ?.detail || t("settings.changeEmail.errorAlreadyUsed");
        Alert.alert(t("common.error"), errorMessage);
      } finally {
        setIsSubmitting(false);
      }
    }, [newEmail, t]);

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

    const renderOTPInput = () => {
      const codeDigitsArray = new Array(6).fill(0);

      return (
        <Pressable
          onPress={() => otpInputRef.current?.focus()}
          className="flex-row justify-between mb-4"
        >
          {codeDigitsArray.map((_, index) => {
            const digit = otpCode[index] || "";
            const isDigitFilled = digit !== "";
            const isCurrentInput = index === otpCode.length;

            return (
              <View
                key={index}
                className={`w-12 h-14 items-center justify-center rounded-xl border-2 ${
                  otpError
                    ? "border-red-400 bg-red-50"
                    : isDigitFilled
                      ? "border-primary bg-forest-50"
                      : isCurrentInput
                        ? "border-primary/60 bg-white"
                        : "border-border-button bg-white"
                }`}
              >
                <Text className="text-2xl text-foreground font-bold">{digit}</Text>
              </View>
            );
          })}
        </Pressable>
      );
    };

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
      if (step === "otp_current") return t("settings.changeEmail.otpInstructionsCurrent");
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
              <Text className="text-base text-foreground-muted mb-6 leading-relaxed">
                {getOtpInstructions()}
              </Text>

              {/* Step indicator for two-step OTP */}
              <View className="flex-row justify-center mb-4 gap-2">
                <View
                  className={`w-2 h-2 rounded-full ${step === "otp_current" ? "bg-primary" : "bg-primary/30"}`}
                />
                <View
                  className={`w-2 h-2 rounded-full ${step === "otp_new" ? "bg-primary" : "bg-primary/30"}`}
                />
              </View>

              {/* Hidden TextInput for OTP */}
              <TextInput
                ref={otpInputRef}
                className="absolute opacity-0"
                keyboardType="number-pad"
                textContentType="oneTimeCode"
                maxLength={6}
                value={otpCode}
                autoComplete="sms-otp"
                onChangeText={(text) => {
                  setOtpCode(text.replace(/[^0-9]/g, ""));
                  setOtpError("");
                }}
                autoFocus
              />

              {renderOTPInput()}

              {otpError && (
                <Text className="text-sm text-red-500 mb-4 text-center">{otpError}</Text>
              )}

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
