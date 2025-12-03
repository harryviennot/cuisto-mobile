import React from "react";
import { View, Text } from "react-native";
import * as Haptics from "expo-haptics";
import { useTranslation } from "react-i18next";
import { AuthCard } from "./AuthCard";
import { AuthButton } from "./AuthButton";
import { OTPInputField } from "@/components/forms/OTPInputField";

interface OTPStepCardProps {
  email: string;
  otpCode: string;
  setOtpCode: (code: string) => void;
  error: string;
  isLoading: boolean;
  onVerify: () => void;
}

export const OTPStepCard: React.FC<OTPStepCardProps> = ({
  email,
  otpCode,
  setOtpCode,
  error,
  isLoading,
  onVerify,
}) => {
  const { t } = useTranslation();

  const handleOtpInput = (text: string) => {
    const numericText = text.replace(/[^0-9]/g, "").slice(0, 6);

    if (numericText.length > otpCode.length) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    setOtpCode(numericText);
  };

  return (
    <AuthCard>
      {/* Header */}
      <View className="mb-10">
        <Text
          className="text-3xl text-white mb-3"
          style={{ fontFamily: "PlayfairDisplay_700Bold" }}
        >
          {t("auth.otpStep.title")}
        </Text>
        <Text className="text-base text-white/50">
          {t("auth.otpStep.subtitle")}{" "}
          <Text className="text-sm text-white font-medium">{email}</Text>
        </Text>
      </View>

      {/* OTP Input */}
      <OTPInputField
        otpCode={otpCode}
        setOtpCode={handleOtpInput}
        maxInputLength={6}
        error={error}
        className="mb-4 px-1"
      />

      {/* Verify Button */}
      <AuthButton
        title={t("auth.otpStep.submit")}
        onPress={onVerify}
        isLoading={isLoading}
        disabled={otpCode.length !== 6}
      />
    </AuthCard>
  );
};
