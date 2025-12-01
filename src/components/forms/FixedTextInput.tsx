import React, { forwardRef } from "react";
import { View, TextInput as RNTextInput, TextInputProps, StyleProp, TextStyle } from "react-native";

interface CustomTextInputProps extends TextInputProps {
  label?: string;
  containerClassName?: string;
  style?: StyleProp<TextStyle>;
}

export const FixedTextInput = forwardRef<RNTextInput, CustomTextInputProps>(
  ({ label, containerClassName, editable = true, style, ...props }, ref) => {
    return (
      <View className={containerClassName}>
        <RNTextInput
          ref={ref}
          editable={editable}
          style={[{ fontFamily: "Inter_400Regular" }, style]}
          {...props}
        />
      </View>
    );
  }
);

FixedTextInput.displayName = "FixedTextInput";
