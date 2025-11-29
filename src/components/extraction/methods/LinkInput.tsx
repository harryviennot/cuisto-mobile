import React from 'react';
import { View, TextInput } from 'react-native';
import { GlobeHemisphereWest } from 'phosphor-react-native';

interface LinkInputProps {
  value: string;
  onChangeText: (text: string) => void;
}

export function LinkInput({ value, onChangeText }: LinkInputProps) {
  return (
    <View className="bg-white rounded-xl p-2 flex-row items-center border border-border-light">
      <View className="w-12 h-12 rounded-[18px] bg-stone-50 items-center justify-center mr-3">
        <GlobeHemisphereWest size={24} color="#a8a29e" weight="duotone" />
      </View>
      <TextInput
        className="flex-1 h-12 text-lg text-foreground-heading leading-snug"
        // style={{ color: "#a8a29e", flex: 1, height: 48, fontSize: 16, fontWeight: "normal", fontFamily: "PlayfairDisplay_400Regular" }}
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
