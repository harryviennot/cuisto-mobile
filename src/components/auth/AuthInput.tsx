import React, { useState, useRef, useEffect } from "react";
import { View, Text, TextInput, TextInputProps, Pressable } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  interpolate,
  interpolateColor,
} from "react-native-reanimated";
import { FixedTextInput } from "../forms/FixedTextInput";

interface AuthInputProps extends Omit<TextInputProps, "style"> {
  label: string;
  error?: string;
}

const AnimatedText = Animated.createAnimatedComponent(Text);

/**
 * AuthInput - Premium underline-style input with floating label
 * Features animated label that floats up when focused/filled
 */
export const AuthInput: React.FC<AuthInputProps> = ({
  label,
  value,
  error,
  onFocus,
  onBlur,
  ...props
}) => {
  const inputRef = useRef<TextInput>(null);
  const [isFocused, setIsFocused] = useState(false);
  const animValue = useSharedValue(value ? 1 : 0);

  const isActive = isFocused || !!value;

  useEffect(() => {
    animValue.value = withTiming(isActive ? 1 : 0, { duration: 200 });
  }, [isActive, animValue]);

  const labelAnimatedStyle = useAnimatedStyle(() => {
    const translateY = interpolate(animValue.value, [0, 1], [0, -24]);
    const scale = interpolate(animValue.value, [0, 1], [1, 0.75]);

    return {
      transform: [{ translateY }, { scale }],
    };
  });

  const labelColorStyle = useAnimatedStyle(() => {
    const color = interpolateColor(
      animValue.value,
      [0, 1],
      ["rgba(255, 255, 255, 0.4)", "rgba(255, 255, 255, 0.7)"]
    );

    return { color };
  });

  const borderColorStyle = useAnimatedStyle(() => {
    const borderColor = error
      ? "rgba(239, 68, 68, 0.8)"
      : interpolateColor(
        animValue.value,
        [0, 1],
        ["rgba(255, 255, 255, 0.2)", "rgba(255, 255, 255, 0.6)"]
      );

    return { borderBottomColor: borderColor };
  });

  const handleFocus = (e: any) => {
    setIsFocused(true);
    onFocus?.(e);
  };

  const handleBlur = (e: any) => {
    setIsFocused(false);
    onBlur?.(e);
  };

  return (
    <View className="mb-6">
      <Pressable onPress={() => inputRef.current?.focus()}>
        <View className="relative pt-4">
          {/* Floating Label */}
          <Animated.View
            className="absolute left-0 top-4 origin-left"
            style={labelAnimatedStyle}
            pointerEvents="none"
          >
            <AnimatedText
              className="text-base"
              style={[{ fontWeight: "400" }, labelColorStyle]}
            >
              {label}
            </AnimatedText>
          </Animated.View>

          {/* Input */}
          <Animated.View
            className="border-b-2"
            style={borderColorStyle}
          >
            <FixedTextInput
              ref={inputRef}
              value={value}
              onFocus={handleFocus}
              onBlur={handleBlur}
              className="py-3  text-white"
              placeholderTextColor="transparent"
              selectionColor="rgba(255, 255, 255, 0.5)"
              style={{ fontSize: 16 }}
              {...props}
            />
          </Animated.View>
        </View>
      </Pressable>

      {/* Error Message */}
      {error && (
        <Text className="mt-2 text-sm text-red-400">{error}</Text>
      )}
    </View>
  );
};
