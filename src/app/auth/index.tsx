import { useState } from "react";
import { View, Text, Pressable, ActivityIndicator, KeyboardAvoidingView, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { ChefHat } from "phosphor-react-native";
import { TextInput } from "@/components/forms/TextInput";
import { authService } from "@/api/services/auth.service";
import Toast from "react-native-toast-message";

export default function AuthEmailEntry() {
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleContinue = async () => {
    // Clear previous error
    setError("");

    // Validate email
    if (!email.trim()) {
      setError("Email is required");
      return;
    }

    if (!validateEmail(email.trim())) {
      setError("Please enter a valid email address");
      return;
    }

    setIsLoading(true);

    try {
      await authService.sendEmailOTP({ email: email.trim().toLowerCase() });

      Toast.show({
        type: "success",
        text1: "Code sent!",
        text2: "Check your email for the verification code",
      });

      // Navigate to OTP verification screen
      router.push({
        pathname: "/auth/verify-otp",
        params: { email: email.trim().toLowerCase() },
      });
    } catch (err: any) {
      console.error("Send OTP error:", err);

      // Handle specific error cases
      if (err.response?.status === 429) {
        setError("Too many attempts. Please wait before trying again.");
      } else if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else {
        setError("Failed to send verification code. Please try again.");
      }

      Toast.show({
        type: "error",
        text1: "Failed to send code",
        text2: err.response?.data?.message || "Please try again",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      className="flex-1 bg-surface"
      style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}
    >
      <View className="flex-1 px-6 justify-center">
        {/* App Branding */}
        <View className="items-center mb-12">
          <View className="bg-primary rounded-full p-6 mb-6">
            <ChefHat size={64} color="#f4f1e8" weight="duotone" />
          </View>
          <Text
            className="text-5xl font-playfair-bold text-foreground-heading mb-2"
            style={{
              fontFamily: "PlayfairDisplay_700Bold",
            }}
          >
            Cuistudio
          </Text>
          <Text className="text-base text-foreground-secondary text-center">
            Your personal recipe collection
          </Text>
        </View>

        {/* Welcome Message */}
        <View className="mb-8">
          <Text className="text-2xl font-playfair-bold text-foreground-heading mb-2">
            Welcome
          </Text>
          <Text className="text-base text-foreground-secondary">
            Enter your email to get started with Cuistudio
          </Text>
        </View>

        {/* Email Input */}
        <TextInput
          label="Email Address"
          placeholder="you@example.com"
          value={email}
          onChangeText={(text) => {
            setEmail(text);
            setError(""); // Clear error on input
          }}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="email"
          error={error}
          editable={!isLoading}
          onSubmitEditing={handleContinue}
          returnKeyType="next"
        />

        {/* Continue Button */}
        <Pressable
          onPress={handleContinue}
          disabled={isLoading}
          className="bg-primary rounded-xl py-4 items-center justify-center active:opacity-80 disabled:opacity-50"
        >
          {isLoading ? (
            <ActivityIndicator color="#f4f1e8" />
          ) : (
            <Text className="text-white font-semibold text-base">Continue</Text>
          )}
        </Pressable>

        {/* Helper Text */}
        <View className="mt-8">
          <Text className="text-sm text-foreground-tertiary text-center">
            We'll send you a 6-digit verification code to confirm your email address
          </Text>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
