import { Pressable, Text, TextInput, View } from "react-native";
import { useRef, useState } from "react";
import { cn } from "@/utils/cn";

interface OTPInputFieldProps {
  otpCode: string;
  setOtpCode: (otpCode: string) => void;
  maxInputLength: number;
  error?: string;
  className?: string;
}

export const OTPInputField = ({ otpCode, setOtpCode, maxInputLength, error, className }: OTPInputFieldProps) => {
  const textInputRef = useRef<TextInput>(null);
  const codeDigitsArray = new Array(maxInputLength).fill(0);

  const handlePress = () => {
    textInputRef.current?.focus();
  };

  const handleOnBlur = () => {
    if (textInputRef.current) {
      textInputRef.current.blur();
    }
  };

  const toCodeDigitInput = (_value: string, index: number) => {
    const digit = otpCode[index] || " ";
    const isDigitFilled = digit !== " ";
    const isCurrentInput = index === otpCode.length;

    return (
      <View
        key={index}
        className={`w-12 items-center border-b-2 pb-3 ${!!error
          ? "border-red-400"
          : isDigitFilled
            ? "border-white"
            : isCurrentInput
              ? "border-white/60"
              : "border-white/20"
          }`}
      >
        <Text className="text-3xl text-white font-bold">{digit}</Text>
      </View>
    )
  };

  return (
    <>
      <TextInput
        className="absolute opacity-0"
        keyboardType="numeric"
        textContentType="oneTimeCode"
        // returnKeyType="done"
        maxLength={maxInputLength}
        value={otpCode}
        autoComplete="sms-otp"
        onChangeText={setOtpCode}
        onBlur={handleOnBlur}
        ref={textInputRef}
      />

      <Pressable onPress={handlePress} className={cn("flex-row justify-between", className)}>
        {codeDigitsArray.map(toCodeDigitInput)}
      </Pressable>

      {error && (
        <Text className="text-sm text-red-400 mb-4">
          {error}
        </Text>
      )}

    </>
  );
};