import { useState, useEffect } from "react";
import {
  View,
  Text,
  Pressable,
  ActivityIndicator,
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import { ArrowLeft, PaperPlaneTilt } from "phosphor-react-native";
import { authService } from "@/api/services/auth.service";
import { useAuth } from "@/contexts/AuthContext";
import Toast from "react-native-toast-message";
import { OTPInputField } from "@/components/forms/OTPInputField";

const MAX_INPUT_LENGTH = 6;

export default function VerifyOTP() {
  const insets = useSafeAreaInsets();
  const { email } = useLocalSearchParams<{ email: string }>();
  const { setTokens, setUser } = useAuth();

  const [otpCode, setOtpCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [error, setError] = useState("");
  const [canResend, setCanResend] = useState(false);
  const [resendTimer, setResendTimer] = useState(60);

  // Countdown timer for resend
  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setCanResend(true);
    }
  }, [resendTimer]);

  // Auto-submit when OTP is complete
  useEffect(() => {
    if (otpCode.length === MAX_INPUT_LENGTH) {
      handleVerify();
    }
  }, [otpCode]);

  const handleVerify = async () => {
    if (otpCode.length !== MAX_INPUT_LENGTH) {
      setError("Please enter the complete 6-digit code");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const response = await authService.verifyEmailOTP({
        email: email!,
        token: otpCode,
        type: "email",
      });

      // Store tokens and user data
      await setTokens(response.access_token, response.refresh_token, response.expires_in);
      setUser(response.user);

      Toast.show({
        type: "success",
        text1: "Email verified!",
        text2: "Welcome to Cuistudio",
      });

      // Navigate to onboarding if new user, otherwise to main app
      if (response.user.is_new_user) {
        router.replace("/auth/onboarding");
      } else {
        router.replace("/(tabs)");
      }
    } catch (err: any) {
      console.error("Verify OTP error:", err);

      // Clear OTP on error
      setOtpCode("");

      // Handle specific error cases
      if (err.response?.status === 401) {
        setError("Invalid or expired code. Please try again.");
      } else if (err.response?.status === 429) {
        setError("Too many attempts. Please wait before trying again.");
      } else if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else {
        setError("Verification failed. Please try again.");
      }

      Toast.show({
        type: "error",
        text1: "Verification failed",
        text2: err.response?.data?.message || "Invalid or expired code",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    if (!canResend) return;

    setIsResending(true);
    setError("");

    try {
      await authService.sendEmailOTP({ email: email! });

      Toast.show({
        type: "success",
        text1: "Code resent!",
        text2: "Check your email for a new verification code",
      });

      // Reset timer
      setCanResend(false);
      setResendTimer(60);

      // Clear OTP
      setOtpCode("");
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

  const handleBack = () => {
    router.back();
  };

  if (!email) {
    router.replace("/auth");
    return null;
  }

  return (
    <View className="flex-1 bg-surface" style={{ paddingTop: insets.top }}>
      {/* Header with Back Button */}
      <View className="px-6 py-4">
        <Pressable onPress={handleBack} className="active:opacity-60">
          <ArrowLeft size={28} color="#3a3226" weight="regular" />
        </Pressable>
      </View>

      <KeyboardAwareScrollView
        contentContainerStyle={{
          flexGrow: 1,
          paddingHorizontal: 24,
          paddingBottom: insets.bottom + 24,
          justifyContent: 'center'
        }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Title and Instructions */}
        <View className="items-center mb-12">
          <View className="bg-primary/10 rounded-full p-4 mb-6">
            <PaperPlaneTilt size={48} color="#334d43" weight="duotone" />
          </View>
          <Text className="text-3xl font-playfair-bold text-foreground-heading mb-2 text-center">
            Check your email
          </Text>
          <Text className="text-base text-foreground-secondary text-center">
            We sent a 6-digit code to
          </Text>
          <Text className="text-base text-foreground font-semibold text-center mt-1">
            {email}
          </Text>
        </View>

        {/* OTP Input */}
        <View className="mb-6">
          <OTPInputField
            otpCode={otpCode}
            setOtpCode={setOtpCode}
            maxInputLength={MAX_INPUT_LENGTH}
            error={error}
          />

          {error && (
            <Text className="text-sm text-danger text-center mt-4">{error}</Text>
          )}
        </View>

        {/* Verify Button */}
        <Pressable
          onPress={handleVerify}
          disabled={isLoading || otpCode.length !== MAX_INPUT_LENGTH}
          className="bg-primary rounded-xl py-4 items-center justify-center active:opacity-80 disabled:opacity-50 mb-6"
        >
          {isLoading ? (
            <ActivityIndicator color="#f4f1e8" />
          ) : (
            <Text className="text-white font-semibold text-base">Verify Code</Text>
          )}
        </Pressable>

        {/* Resend Code */}
        <View className="items-center">
          <Text className="text-sm text-foreground-tertiary mb-2">
            Didn't receive the code?
          </Text>
          {canResend ? (
            <Pressable
              onPress={handleResend}
              disabled={isResending}
              className="active:opacity-60"
            >
              <Text className="text-primary font-semibold text-base">
                {isResending ? "Sending..." : "Resend Code"}
              </Text>
            </Pressable>
          ) : (
            <Text className="text-foreground-secondary text-base">
              Resend in {resendTimer}s
            </Text>
          )}
        </View>

        {/* Helper Text */}
        <View className="mt-8">
          <Text className="text-sm text-foreground-tertiary text-center">
            The code expires in 3 minutes. You can request a new code after 60 seconds.
          </Text>
        </View>
      </KeyboardAwareScrollView>
    </View>
  );
}
