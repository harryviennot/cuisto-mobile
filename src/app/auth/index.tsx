import { useState, useCallback, useEffect } from "react";
import { View, Text, StatusBar, Pressable } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ArrowLeftIcon } from "phosphor-react-native";
import * as Haptics from "expo-haptics";
import { authService } from "@/api/services/auth.service";
import { useAuth } from "@/contexts/AuthContext";
import Toast from "react-native-toast-message";
import { AuthBackground, EmailStepCard, OTPStepCard } from "@/components/auth";

type AuthStep = "email" | "otp";

export default function AuthScreen() {
  const insets = useSafeAreaInsets();
  const { setTokens, setUser } = useAuth();

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
      setEmailError("Email is required");
      return;
    }

    if (!validateEmail(email.trim())) {
      setEmailError("Please enter a valid email address");
      return;
    }

    setIsSendingOtp(true);

    try {
      await authService.sendEmailOTP({ email: email.trim().toLowerCase() });

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      Toast.show({
        type: "success",
        text1: "Code sent!",
        text2: "Check your email for the verification code",
      });

      setCurrentStep("otp");
      setCanResend(false);
      setResendTimer(60);
    } catch (err: any) {
      console.error("Send OTP error:", err);

      if (err.response?.status === 429) {
        setEmailError("Too many attempts. Please wait before trying again.");
      } else if (err.response?.data?.message) {
        setEmailError(err.response.data.message);
      } else {
        setEmailError("Failed to send verification code. Please try again.");
      }

      Toast.show({
        type: "error",
        text1: "Failed to send code",
        text2: err.response?.data?.message || "Please try again",
      });
    } finally {
      setIsSendingOtp(false);
    }
  };

  const handleVerifyOtp = useCallback(async () => {
    if (otpCode.length !== 6) {
      setOtpError("Please enter the complete 6-digit code");
      return;
    }

    setIsVerifying(true);
    setOtpError("");

    try {
      const response = await authService.verifyEmailOTP({
        email: email.trim().toLowerCase(),
        token: otpCode,
        type: "email",
      });

      await setTokens(response.access_token, response.refresh_token, response.expires_in);
      setUser(response.user);

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      Toast.show({
        type: "success",
        text1: "Email verified!",
        text2: "Welcome to Cuistudio",
      });

      // Navigation is handled automatically by ProtectedNavigation
      // based on isAuthenticated and is_new_user state
    } catch (err: any) {
      console.error("Verify OTP error:", err);
      setOtpCode("");

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);

      if (err.response?.status === 401) {
        setOtpError("Invalid or expired code. Please try again.");
      } else if (err.response?.status === 429) {
        setOtpError("Too many attempts. Please wait before trying again.");
      } else if (err.response?.data?.message) {
        setOtpError(err.response.data.message);
      } else {
        setOtpError("Verification failed. Please try again.");
      }

      Toast.show({
        type: "error",
        text1: "Verification failed",
        text2: err.response?.data?.message || "Invalid or expired code",
      });
    } finally {
      setIsVerifying(false);
    }
  }, [otpCode, email, setTokens, setUser]);

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
      await authService.sendEmailOTP({ email: email.trim().toLowerCase() });

      Toast.show({
        type: "success",
        text1: "Code resent!",
        text2: "Check your email for a new verification code",
      });

      setOtpCode("");
      setCanResend(false);
      setResendTimer(60);
    } catch (err: any) {
      console.error("Resend OTP error:", err);

      Toast.show({
        type: "error",
        text1: "Failed to resend code",
        text2: err.response?.data?.message || "Please try again",
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
        {currentStep === "otp" && (
          <Pressable
            onPress={handleBackToEmail}
            className="absolute left-6 z-10 rounded-full p-2 active:bg-white/10"
          >
            <ArrowLeftIcon size={24} color="white" weight="bold" />
          </Pressable>
        )}
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
              By continuing, you agree to our{" "}
              <Text className="text-white/50 underline">Terms of Service</Text> and{" "}
              <Text className="text-white/50 underline">Privacy Policy</Text>.
            </Text>
          ) : (
            <View className="items-center">
              <Text className="text-sm text-white/40 mb-2">Didn&apos;t receive the code?</Text>
              {canResend ? (
                <Pressable
                  onPress={handleResendOtp}
                  disabled={isResending}
                  className="active:opacity-60"
                >
                  <Text className="text-sm font-bold uppercase tracking-[0.15em] text-primary-light">
                    {isResending ? "Sending..." : "Resend Code"}
                  </Text>
                </Pressable>
              ) : (
                <Text className="text-sm text-white/60">Resend in {resendTimer}s</Text>
              )}
            </View>
          )}
        </View>
      </KeyboardAwareScrollView>
    </AuthBackground>
  );
}
