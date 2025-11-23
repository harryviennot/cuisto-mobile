import React, { forwardRef } from "react";
import { View, Text, TextInput as RNTextInput, TextInputProps } from "react-native";
import { cn } from "@/utils/cn";

interface CustomTextInputProps extends TextInputProps {
  label?: string;
  error?: string;
  helperText?: string;
  containerClassName?: string;
  inputClassName?: string;
}

export const TextInput = forwardRef<RNTextInput, CustomTextInputProps>(
  (
    { label, error, helperText, containerClassName, inputClassName, editable = true, ...props },
    ref
  ) => {
    const hasError = !!error;

    return (
      <View className={cn("mb-4", containerClassName)}>
        {label && (
          <Text className="font-bold shrink-0 text-sm uppercase tracking-widest text-foreground-tertiary mb-2">
            {label}
          </Text>
        )}
        <RNTextInput
          ref={ref}
          editable={editable}
          className={cn(
            "rounded-xl border px-4 py-3.5 text-base text-foreground",
            "font-normal leading-normal",
            hasError
              ? "border-red-500 bg-red-50"
              : "border-border-button bg-white focus:border-primary",
            !editable && "bg-surface-texture-light text-foreground-muted",
            inputClassName
          )}
          placeholderTextColor="#a89f8d"
          {...props}
        />
        {error && <Text className="mt-1.5 text-sm text-red-600">{error}</Text>}
        {helperText && !error && (
          <Text className="mt-1.5 text-sm text-foreground-muted">{helperText}</Text>
        )}
      </View>
    );
  }
);

TextInput.displayName = "TextInput";
