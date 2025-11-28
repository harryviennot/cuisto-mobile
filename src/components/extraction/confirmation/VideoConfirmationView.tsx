/**
 * Video confirmation view for extraction bottom sheet
 * Shows a text input for entering video URL
 */
import React, { useState } from "react";
import { View, Text, Pressable, ActivityIndicator } from "react-native";
import { BottomSheetTextInput } from "@gorhom/bottom-sheet";
import { Check, ArrowLeft, Link } from "phosphor-react-native";
import { useTranslation } from "react-i18next";

interface VideoConfirmationViewProps {
  onConfirm: (url: string) => void;
  onBack: () => void;
  isSubmitting: boolean;
}

export function VideoConfirmationView({
  onConfirm,
  onBack,
  isSubmitting,
}: VideoConfirmationViewProps) {
  const { t } = useTranslation();
  const [videoUrl, setVideoUrl] = useState("");

  const isValidUrl = videoUrl.trim().length > 0;

  const handleConfirm = () => {
    if (isValidUrl && !isSubmitting) {
      onConfirm(videoUrl.trim());
    }
  };

  return (
    <View className="bg-surface-elevated px-6 pt-4">
      {/* Header */}
      <View className="mb-4 flex-row items-center justify-between">
        {!isSubmitting && (
          <Pressable onPress={onBack} className="p-1">
            <ArrowLeft size={24} color="#6b5d4a" weight="regular" />
          </Pressable>
        )}
        <Text className="flex-1 text-center text-base font-medium text-foreground-secondary">
          {t("extraction.extractFromVideo")}
        </Text>
        <View style={{ width: 24 }} />
      </View>

      {/* URL Input */}
      <View className="mb-4">
        <View className="flex-row items-center gap-3 rounded-2xl border-2 border-border bg-surface px-4 py-3">
          <Link size={24} color="#334d43" weight="duotone" />
          <BottomSheetTextInput
            className="flex-1 text-base text-foreground"
            placeholder={t("extraction.videoUrlPlaceholder")}
            placeholderTextColor="#9ca3af"
            value={videoUrl}
            onChangeText={setVideoUrl}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="url"
            editable={!isSubmitting}
          />
        </View>
      </View>

      {/* Confirm Button */}
      <View className="pb-4 pt-4">
        {isSubmitting ? (
          <View className="flex-row items-center justify-center gap-3 rounded-2xl bg-primary px-6 py-4">
            <ActivityIndicator color="#fefdfb" />
            <Text className="text-base font-semibold text-surface-elevated">
              {t("extraction.extractingRecipe")}
            </Text>
          </View>
        ) : (
          <Pressable
            onPress={handleConfirm}
            disabled={!isValidUrl}
            className={`flex-row items-center justify-center gap-2 rounded-2xl px-6 py-4 ${
              !isValidUrl ? "bg-interactive-muted opacity-50" : "bg-primary active:bg-primary-dark"
            }`}
          >
            <Check size={20} color="#fefdfb" weight="bold" />
            <Text className="text-base font-semibold text-surface-elevated">
              {t("extraction.confirmExtract")}
            </Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}
