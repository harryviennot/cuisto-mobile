import React from "react";
import { View, TextInput, TouchableOpacity } from "react-native";
import { ClipboardTextIcon } from "phosphor-react-native";
import * as Clipboard from "expo-clipboard";

interface LinkInputProps {
  value: string;
  onChangeText: (text: string) => void;
}

export function LinkInput({ value, onChangeText }: LinkInputProps) {
  const handlePasteFromClipboard = async () => {
    const clipboardContent = await Clipboard.getStringAsync();
    if (clipboardContent) {
      onChangeText(clipboardContent);
    }
  };

  return (
    <View className="bg-white rounded-xl p-2 flex-row items-center border border-border-light">
      <TouchableOpacity
        onPress={handlePasteFromClipboard}
        className="w-12 h-12 rounded-lg bg-primary/10 items-center justify-center mr-2"
      >
        <ClipboardTextIcon size={22} color="#334d43" weight="duotone" />
      </TouchableOpacity>
      <TextInput
        className="flex-1 h-12 text-lg text-foreground-heading leading-snug"
        placeholder="Paste URL here..."
        placeholderTextColor="#a8a29e"
        value={value}
        onChangeText={onChangeText}
        autoCapitalize="none"
        autoCorrect={false}
        keyboardType="url"
        autoFocus
      />
    </View>
  );
}
