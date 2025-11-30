import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { Microphone } from "phosphor-react-native";

interface VoiceInputProps {
  value: string;
  onChangeText: (text: string) => void;
}

export function VoiceInput({ value, onChangeText }: VoiceInputProps) {
  const isRecording = !value;

  const handlePress = () => {
    // TODO: Implement actual voice recording
    // For now, toggle between mock recording states
    if (isRecording) {
      onChangeText("To make the pasta, first boil water...");
    } else {
      onChangeText("");
    }
  };

  return (
    <View className="flex-1 items-center justify-center">
      <TouchableOpacity
        activeOpacity={0.8}
        className={`w-24 h-24 rounded-full items-center justify-center mb-8 ${
          isRecording ? "bg-danger shadow-lg shadow-danger/30" : "bg-primary"
        }`}
        onPress={handlePress}
      >
        {value ? (
          <Microphone size={32} color="#fff" weight="fill" />
        ) : (
          <View className="w-8 h-8 rounded bg-white" />
        )}
        {isRecording && (
          <View className="absolute inset-0 rounded-full border-2 border-danger opacity-50 scale-125" />
        )}
      </TouchableOpacity>

      <View className="max-w-[280px] min-h-[100px] items-center">
        {value ? (
          <Text className="font-playfair text-2xl text-foreground-heading text-center leading-8">
            &ldquo;{value}&rdquo;
          </Text>
        ) : (
          <Text className="text-base font-medium text-foreground-tertiary">
            Tap to start recording
          </Text>
        )}
      </View>
    </View>
  );
}
