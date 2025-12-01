import { Pressable, Text, TextInput, View } from "react-native";
import { useRef, useState } from "react";

interface OTPInputFieldProps {
  otpCode: string;
  setOtpCode: (otpCode: string) => void;
  maxInputLength: number;
  error?: string;
}

export const OTPInputField = ({ otpCode, setOtpCode, maxInputLength, error }: OTPInputFieldProps) => {
  const textInputRef = useRef<TextInput>(null);
  const codeDigitsArray = new Array(maxInputLength).fill(0);
  const [isFocused, setIsFocused] = useState(false);

  const handlePress = () => {
    // setIsFocused(true);
    textInputRef.current?.focus();
  };

  const handleOnBlur = () => {
    // setIsFocused(false);
    if (textInputRef.current) {
      textInputRef.current.blur();
    }
  };

  const toCodeDigitInput = (_value: string, index: number) => {
    const digit = otpCode[index] || " ";
    const isDigitFilled = digit !== " ";

    const isCurrentInput = index === otpCode.length;

    const shouldBorderCurrentInput = isCurrentInput || isDigitFilled;

    return (
      <View
        key={index}
        className={`w-12 h-14 items-center justify-center  rounded-xl border-2 ${error
          ? "border-danger bg-danger-muted"
          : shouldBorderCurrentInput
            ? "border-primary bg-white"
            : "border-border-button bg-white"
          }`}
      >
        <Text className="text-2xl font-semibold text-primary-foreground">{digit}</Text>
      </View>
    )
  };

  return (
    <View className="flex items-center justify-center">
      <Pressable onPress={handlePress} className="flex-row gap-3 justify-center mb-4">
        {codeDigitsArray.map(toCodeDigitInput)}
      </Pressable>

      <TextInput
        className="w-12 h-12 border border-gray-300 rounded-md text-center absolute  opacity-0"
        keyboardType="numeric"
        textContentType="oneTimeCode"
        returnKeyType="done"
        maxLength={maxInputLength}
        value={otpCode}
        autoComplete="sms-otp"
        onChangeText={setOtpCode}
        onBlur={handleOnBlur}
        ref={textInputRef}
      />
    </View >
  );
};