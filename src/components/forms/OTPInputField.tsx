import { Pressable, Text, TextInput, View } from "react-native";
import { useRef, forwardRef, useImperativeHandle } from "react";
import { cn } from "@/utils/cn";

interface OTPInputFieldProps {
  otpCode: string;
  setOtpCode: (otpCode: string) => void;
  maxInputLength: number;
  error?: string;
  className?: string;
  /** Visual variant: "dark" for dark backgrounds (white text), "light" for light backgrounds */
  variant?: "dark" | "light";
  /** Auto focus the input on mount */
  autoFocus?: boolean;
}

export interface OTPInputFieldRef {
  focus: () => void;
  blur: () => void;
}

export const OTPInputField = forwardRef<OTPInputFieldRef, OTPInputFieldProps>(
  (
    {
      otpCode,
      setOtpCode,
      maxInputLength,
      error,
      className,
      variant = "dark",
      autoFocus = false,
    },
    ref
  ) => {
    const textInputRef = useRef<TextInput>(null);
    const codeDigitsArray = new Array(maxInputLength).fill(0);

    useImperativeHandle(ref, () => ({
      focus: () => textInputRef.current?.focus(),
      blur: () => textInputRef.current?.blur(),
    }));

    const handlePress = () => {
      textInputRef.current?.focus();
    };

    const handleOnBlur = () => {
      if (textInputRef.current) {
        textInputRef.current.blur();
      }
    };

    const isDark = variant === "dark";

    const toCodeDigitInput = (_value: string, index: number) => {
      const digit = otpCode[index] || " ";
      const isDigitFilled = digit !== " ";
      const isCurrentInput = index === otpCode.length;

      if (isDark) {
        // Dark variant: underline style with white text (for dark backgrounds)
        return (
          <View
            key={index}
            className={cn(
              "w-12 items-center border-b-2 pb-3",
              error
                ? "border-red-400"
                : isDigitFilled
                  ? "border-white"
                  : isCurrentInput
                    ? "border-white/60"
                    : "border-white/20"
            )}
          >
            <Text className="text-3xl text-white font-bold">{digit}</Text>
          </View>
        );
      }

      // Light variant: box style with dark text (for light backgrounds)
      return (
        <View
          key={index}
          className={cn(
            "w-12 h-14 items-center justify-center rounded-xl border-2",
            error
              ? "border-red-400 bg-red-50"
              : isDigitFilled
                ? "border-primary bg-forest-50"
                : isCurrentInput
                  ? "border-primary/60 bg-white"
                  : "border-border-button bg-white"
          )}
        >
          <Text className="text-2xl text-foreground font-bold">
            {digit === " " ? "" : digit}
          </Text>
        </View>
      );
    };

    return (
      <>
        <TextInput
          className="absolute opacity-0"
          keyboardType="numeric"
          textContentType="oneTimeCode"
          maxLength={maxInputLength}
          value={otpCode}
          autoComplete="sms-otp"
          onChangeText={setOtpCode}
          onBlur={handleOnBlur}
          ref={textInputRef}
          autoFocus={autoFocus}
        />

        <Pressable
          onPress={handlePress}
          className={cn("flex-row justify-between", className)}
        >
          {codeDigitsArray.map(toCodeDigitInput)}
        </Pressable>

        {error && (
          <Text
            className={cn(
              "text-sm mb-4",
              isDark ? "text-red-400" : "text-red-500 text-center"
            )}
          >
            {error}
          </Text>
        )}
      </>
    );
  }
);

OTPInputField.displayName = "OTPInputField";
