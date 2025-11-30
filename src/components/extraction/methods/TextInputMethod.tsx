import React from "react";
import { View, TextInput } from "react-native";

interface TextInputMethodProps {
  value: string;
  onChangeText: (text: string) => void;
}

export function TextInputMethod({ value, onChangeText }: TextInputMethodProps) {
  return (
    <View className="flex-1 bg-[#FDFBF7] rounded rounded-t-none border border-border-light relative overflow-hidden min-h-[300px]">
      {/* Lined paper effect */}
      <View className="absolute inset-0 pt-[32px]" pointerEvents="none">
        {Array.from({ length: 20 }).map((_, i) => (
          <View key={i} className="h-[1px] bg-stone-200 mt-[32px] w-full" />
        ))}
      </View>
      {/* Red margin line */}
      <View
        className="absolute left-12 top-0 bottom-0 w-[1px] bg-red-500/20"
        pointerEvents="none"
      />

      <TextInput
        className="flex-1 text-lg leading-[2.2] text-foreground-heading pl-[60px] pr-6 pt-[34px]"
        placeholder="Start writing..."
        placeholderTextColor="#a8a29e"
        value={value}
        onChangeText={onChangeText}
        multiline
        textAlignVertical="top"
        autoFocus
      />
    </View>
  );
}
