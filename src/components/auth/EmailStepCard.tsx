import React from "react";
import { View, Text } from "react-native";
import { StarIcon } from "phosphor-react-native";
import { AuthCard } from "./AuthCard";
import { AuthInput } from "./AuthInput";
import { AuthButton } from "./AuthButton";

interface EmailStepCardProps {
  email: string;
  setEmail: (email: string) => void;
  error: string;
  setError: (error: string) => void;
  isLoading: boolean;
  onContinue: () => void;
}

export const EmailStepCard: React.FC<EmailStepCardProps> = ({
  email,
  setEmail,
  error,
  setError,
  isLoading,
  onContinue,
}) => {
  return (
    <AuthCard>
      {/* Header */}
      <View className="mb-8">
        <View className="mb-4 flex-row items-center gap-2">
          <View className="rounded-full bg-primary/20 border border-primary/30 px-3 py-1.5">
            <View className="flex-row items-center gap-1.5">
              <StarIcon size={12} color="#91b5a7" weight="fill" />
              <Text className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary-light">
                Welcome
              </Text>
            </View>
          </View>
        </View>

        <Text
          className="text-3xl text-white mb-2"
          style={{ fontFamily: "PlayfairDisplay_700Bold" }}
        >
          Sign in to continue
        </Text>
        <Text className="text-base text-white/50">
          Enter your email to begin your culinary journey.
        </Text>
      </View>

      {/* Email Input */}
      <AuthInput
        label="Email Address"
        value={email}
        onChangeText={(text) => {
          setEmail(text);
          setError("");
        }}
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
        autoComplete="email"
        error={error}
        editable={!isLoading}
        onSubmitEditing={onContinue}
        returnKeyType="next"
      />

      {/* Continue Button */}
      <AuthButton
        title="Continue"
        onPress={onContinue}
        isLoading={isLoading}
        disabled={!email.trim()}
      />
    </AuthCard>
  );
};
