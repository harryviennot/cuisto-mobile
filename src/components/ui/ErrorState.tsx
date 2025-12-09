import "@/global.css";
import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { WarningCircleIcon, ArrowCounterClockwiseIcon } from "phosphor-react-native";

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  retryLabel?: string;
  showIcon?: boolean;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = "Something went wrong",
  message = "We encountered an error loading this content.",
  onRetry,
  retryLabel = "Try again",
  showIcon = true,
}) => {
  return (
    <View className="flex-1 justify-center items-center px-6 py-12">
      {showIcon && (
        <View className="mb-4 opacity-90">
          <WarningCircleIcon size={48} weight="duotone" color="#EF4444" />
        </View>
      )}

      <Text className="text-xl font-semibold text-gray-800 text-center mb-2">{title}</Text>

      {message && (
        <Text className="text-base text-gray-600 text-center leading-6 mb-6">{message}</Text>
      )}

      {onRetry && (
        <TouchableOpacity
          className="flex-row items-center bg-primary px-6 py-3 rounded-xl gap-2 mt-8"
          onPress={onRetry}
          activeOpacity={0.7}
        >
          <ArrowCounterClockwiseIcon size={20} weight="bold" color="#FFFFFF" />
          <Text className="text-base font-semibold text-white">{retryLabel}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};
