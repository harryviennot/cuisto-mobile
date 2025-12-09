import { useState, useCallback, useEffect } from "react";
import { View, Text, StatusBar, Pressable } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ArrowLeftIcon } from "phosphor-react-native";
import * as Haptics from "expo-haptics";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/contexts/AuthContext";
import Toast from "react-native-toast-message";
import { AuthBackground, EmailStepCard, OTPStepCard } from "@/components/auth";
import { Link, router } from "expo-router";

type AuthStep = "email" | "otp";

export default function AuthScreen() {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const { sendEmailOTP, verifyEmailOTP } = useAuth();

  // Current step
  const [currentStep, setCurrentStep] = useState<AuthStep>("email");

  // Email state
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const [isSendingOtp, setIsSendingOtp] = useState(false);

  // OTP state
  const [otpCode, setOtpCode] = useState("");
  const [otpError, setOtpError] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [canResend, setCanResend] = useState(false);
  const [resendTimer, setResendTimer] = useState(60);

  // Resend timer countdown
  useEffect(() => {
    if (currentStep !== "otp") return;

    if (resendTimer > 0 && !canResend) {
      const timer = setTimeout(() => setResendTimer((prev) => prev - 1), 1000);
      return () => clearTimeout(timer);
    } else if (resendTimer === 0) {
      setCanResend(true);
    }
  }, [resendTimer, canResend, currentStep]);

  const validateEmail = (emailValue: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(emailValue);
  };

  const handleSendOtp = async () => {
    setEmailError("");

    if (!email.trim()) {
      setEmailError(t("auth.validation.emailRequired"));
      return;
    }

    if (!validateEmail(email.trim())) {
      setEmailError(t("auth.validation.emailInvalid"));
      return;
    }

    setIsSendingOtp(true);

    try {
      await sendEmailOTP(email.trim().toLowerCase());

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      Toast.show({
        type: "success",
        text1: t("auth.toast.codeSent"),
        text2: t("auth.toast.codeSentDescription"),
      });

      setCurrentStep("otp");
      setCanResend(false);
      setResendTimer(60);
    } catch (err: any) {
      console.error("Send OTP error:", err);

      // Supabase error format
      if (err.status === 429 || err.message?.includes("rate limit")) {
        setEmailError(t("auth.errors.tooManyAttempts"));
      } else if (err.message) {
        setEmailError(err.message);
      } else {
        setEmailError(t("auth.errors.failedToSendCode"));
      }

      Toast.show({
        type: "error",
        text1: t("auth.toast.failedToSend"),
        text2: err.message || t("common.tryAgain"),
      });
    } finally {
      setIsSendingOtp(false);
    }
  };

  const handleVerifyOtp = useCallback(async () => {
    if (otpCode.length !== 6) {
      setOtpError(t("auth.validation.otpIncomplete"));
      return;
    }

    setIsVerifying(true);
    setOtpError("");

    try {
      // verifyEmailOTP now handles everything: Supabase auth + fetching user info
      await verifyEmailOTP(email.trim().toLowerCase(), otpCode);

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      Toast.show({
        type: "success",
        text1: t("auth.toast.verified"),
        text2: t("auth.toast.verifiedDescription"),
      });

      // Navigation is handled automatically by Stack.Protected guards
      // in _layout.tsx based on authStatus from AuthContext
    } catch (err: any) {
      console.error("Verify OTP error:", err);
      setOtpCode("");

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);

      // Supabase error format
      if (err.message?.includes("Invalid") || err.message?.includes("expired")) {
        setOtpError(t("auth.errors.invalidOrExpired"));
      } else if (err.status === 429 || err.message?.includes("rate limit")) {
        setOtpError(t("auth.errors.tooManyAttempts"));
      } else if (err.message) {
        setOtpError(err.message);
      } else {
        setOtpError(t("auth.errors.verificationFailed"));
      }

      Toast.show({
        type: "error",
        text1: t("auth.toast.verificationFailed"),
        text2: err.message || t("auth.toast.invalidCode"),
      });
    } finally {
      setIsVerifying(false);
    }
  }, [otpCode, email, verifyEmailOTP, t]);

  // Auto-submit OTP when complete
  useEffect(() => {
    if (otpCode.length === 6 && currentStep === "otp") {
      handleVerifyOtp();
    }
  }, [otpCode, currentStep, handleVerifyOtp]);

  const handleResendOtp = async () => {
    if (!canResend) return;

    setIsResending(true);
    setOtpError("");

    try {
      await sendEmailOTP(email.trim().toLowerCase());

      Toast.show({
        type: "success",
        text1: t("auth.toast.codeResent"),
        text2: t("auth.toast.codeResentDescription"),
      });

      setOtpCode("");
      setCanResend(false);
      setResendTimer(60);
    } catch (err: any) {
      console.error("Resend OTP error:", err);

      Toast.show({
        type: "error",
        text1: t("auth.toast.failedToResend"),
        text2: err.message || t("common.tryAgain"),
      });
    } finally {
      setIsResending(false);
    }
  };

  const handleBackToEmail = () => {
    setCurrentStep("email");
    setOtpCode("");
    setOtpError("");
  };

  return (
    <AuthBackground>
      <StatusBar barStyle="light-content" />

      {/* Header - Fixed at top */}
      <View
        className="absolute left-0 right-0 z-10 flex-row items-center justify-center gap-2"
        style={{ top: insets.top + 16 }}
      >
        <Pressable
          onPress={currentStep === "otp" ? handleBackToEmail : router.back}
          className="absolute left-6 z-10 rounded-full p-2 active:bg-white/10"
        >
          <ArrowLeftIcon size={24} color="white" weight="bold" />
        </Pressable>

        <View
          className={`h-2 rounded-full ${currentStep === "email" ? "w-6 bg-white" : "w-2 bg-white/30"}`}
        />
        <View
          className={`h-2 rounded-full ${currentStep === "otp" ? "w-6 bg-white" : "w-2 bg-white/30"}`}
        />
      </View>

      <KeyboardAwareScrollView
        contentContainerStyle={{
          flexGrow: 1,
          paddingHorizontal: 24,
          paddingTop: insets.top + 60,
          paddingBottom: insets.bottom + 24,
          justifyContent: "center",
        }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Card - conditionally rendered */}
        {currentStep === "email" ? (
          <EmailStepCard
            email={email}
            setEmail={setEmail}
            error={emailError}
            setError={setEmailError}
            isLoading={isSendingOtp}
            onContinue={handleSendOtp}
          />
        ) : (
          <OTPStepCard
            email={email.trim().toLowerCase()}
            otpCode={otpCode}
            setOtpCode={setOtpCode}
            error={otpError}
            isLoading={isVerifying}
            onVerify={handleVerifyOtp}
          />
        )}

        {/* Footer - directly below card */}
        <View className="mt-6">
          {currentStep === "email" ? (
            <Text className="text-xs text-white/30 text-center leading-5">
              {t("auth.footer.termsPrefix")}
              <Link href="https://cuisto.app/terms" className="text-white/50 underline">
                {t("auth.footer.termsOfService")}
              </Link>
              {t("auth.footer.and")}
              <Link href="https://cuisto.app/privacy" className="text-white/50 underline">
                {t("auth.footer.privacyPolicy")}
              </Link>
              .
            </Text>
          ) : (
            <View className="items-center">
              <Text className="text-sm text-white/40 mb-2">{t("auth.footer.didntReceive")}</Text>
              {canResend ? (
                <Pressable
                  onPress={handleResendOtp}
                  disabled={isResending}
                  className="active:opacity-90"
                >
                  <Text className="text-sm font-bold uppercase tracking-[0.15em] text-primary-light">
                    {isResending ? t("auth.footer.sending") : t("auth.footer.resendCode")}
                  </Text>
                </Pressable>
              ) : (
                <Text className="text-sm text-white/60">
                  {t("auth.footer.resendIn", { seconds: resendTimer })}
                </Text>
              )}
            </View>
          )}
        </View>
      </KeyboardAwareScrollView>
    </AuthBackground>
  );
}
