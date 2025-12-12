import React, { useState } from "react";
import { View, Text, TouchableOpacity, Platform, KeyboardAvoidingView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { X, ArrowRight } from "phosphor-react-native";
import Animated, { FadeIn } from "react-native-reanimated";
import Toast from "react-native-toast-message";
import { useTranslation } from "react-i18next";

import { extractionService } from "@/api/services/extraction.service";
import { SourceType } from "@/types/extraction";
import { useSettings } from "@/contexts/SettingsContext";
import i18n from "@/locales/i18n";
import {
  LinkInput,
  TextInputMethod,
  ImageInput,
  VoiceInput,
} from "@/components/extraction/methods";
import { useImagePicker, type PickedImage } from "@/hooks/useImagePicker";

type UploadState = "uploading" | "completed" | "error";
const MAX_IMAGES = 3;

type Method = "link" | "text" | "image" | "voice";

export default function ExtractionScreen() {
  const { t } = useTranslation();
  const { method } = useLocalSearchParams<{ method: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { settings } = useSettings();

  const METHOD_CONFIG = {
    link: {
      title: t("extraction.methodScreen.link.title"),
      subtitle: t("extraction.methodScreen.link.subtitle"),
    },
    text: {
      title: t("extraction.methodScreen.text.title"),
      subtitle: t("extraction.methodScreen.text.subtitle"),
    },
    image: {
      title: t("extraction.methodScreen.image.title"),
      subtitle: t("extraction.methodScreen.image.subtitle"),
    },
    voice: {
      title: t("extraction.methodScreen.voice.title"),
      subtitle: t("extraction.methodScreen.voice.subtitle"),
    },
  };

  // Validate method
  const validMethod = (
    method && ["link", "text", "image", "voice"].includes(method) ? method : "link"
  ) as Method;

  const config = METHOD_CONFIG[validMethod];

  // State
  const [inputValue, setInputValue] = useState("");
  const [selectedImages, setSelectedImages] = useState<PickedImage[]>([]);
  const [uploadStates, setUploadStates] = useState<Record<number, UploadState>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Image picker hook
  const { pickImages, pickSingleImage } = useImagePicker();

  // Image handlers
  const handleAddFromCamera = async () => {
    const image = await pickSingleImage("camera");
    if (image) {
      setSelectedImages((prev) => [...prev, image].slice(0, MAX_IMAGES));
    }
  };

  const handleAddFromGallery = async () => {
    const remainingSlots = MAX_IMAGES - selectedImages.length;
    if (remainingSlots <= 0) return;

    const images = await pickImages("gallery", { maxImages: remainingSlots });
    if (images && images.length > 0) {
      setSelectedImages((prev) => [...prev, ...images].slice(0, MAX_IMAGES));
    }
  };

  const handleRemoveImage = (index: number) => {
    setSelectedImages((prev) => prev.filter((_, i) => i !== index));
    // Clear upload states and reindex
    setUploadStates({});
  };

  const handleClose = () => router.back();

  const handleExtract = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);

    // Only send user_locale if auto-translate is enabled
    const userLocale = settings.autoTranslateRecipes ? i18n.language : undefined;

    try {
      if (validMethod === "image" && selectedImages.length > 0) {
        // Set all images to uploading state
        const initialUploadStates: Record<number, UploadState> = {};
        selectedImages.forEach((_, index) => {
          initialUploadStates[index] = "uploading";
        });
        setUploadStates(initialUploadStates);

        const formData = new FormData();
        selectedImages.forEach((image) => {
          formData.append("files", {
            uri: Platform.OS === "android" ? image.uri : image.uri.replace("file://", ""),
            name: image.name,
            type: image.type,
          } as unknown as Blob);
        });

        const response = await extractionService.submitImages(formData, userLocale);

        // Mark all as completed on success
        const completedStates: Record<number, UploadState> = {};
        selectedImages.forEach((_, index) => {
          completedStates[index] = "completed";
        });
        setUploadStates(completedStates);

        if (response && response.job_id) {
          router.replace({
            pathname: "/extraction/preview",
            params: { jobId: response.job_id },
          });
        }
      } else if (inputValue.trim()) {
        let sourceType = SourceType.LINK;
        let payload: Record<string, string> = {};

        if (validMethod === "link") {
          sourceType = SourceType.LINK;
          payload = { source_url: inputValue };
        } else if (validMethod === "text") {
          sourceType = SourceType.PASTE;
          payload = { text_content: inputValue };
        } else if (validMethod === "voice") {
          sourceType = SourceType.VOICE;
          payload = { text_content: inputValue };
        }

        const response = await extractionService.submit({
          source_type: sourceType,
          ...payload,
          user_locale: userLocale,
        });

        if (response && response.id) {
          router.replace({
            pathname: "/extraction/preview",
            params: { jobId: response.id },
          });
        }
      }
    } catch (error) {
      console.error("Extraction error:", error);
      Toast.show({
        type: "error",
        text1: t("errors.extractionFailed"),
        text2: error instanceof Error ? error.message : "Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const canSubmit = validMethod === "image" ? selectedImages.length > 0 : !!inputValue.trim();

  const renderMethodInput = () => {
    switch (validMethod) {
      case "link":
        return <LinkInput value={inputValue} onChangeText={setInputValue} />;
      case "text":
        return <TextInputMethod value={inputValue} onChangeText={setInputValue} />;
      case "image":
        return (
          <ImageInput
            images={selectedImages}
            uploadStates={uploadStates}
            maxItems={MAX_IMAGES}
            onRemoveImage={handleRemoveImage}
            onAddFromCamera={handleAddFromCamera}
            onAddFromGallery={handleAddFromGallery}
            isUploading={isSubmitting}
          />
        );
      case "voice":
        return <VoiceInput value={inputValue} onChangeText={setInputValue} />;
      default:
        return null;
    }
  };

  return (
    <View className="flex-1 bg-[#FDFBF7]">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <Animated.View entering={FadeIn.delay(100).duration(300)} className="flex-1 px-6">
          {/* Header */}
          <View
            className="flex-row justify-between items-center mb-6"
            style={{ marginTop: insets.top + 20 }}
          >
            <TouchableOpacity
              onPress={handleClose}
              className="w-10 h-10 rounded-full bg-stone-100 items-center justify-center"
            >
              <X size={20} color="#78716c" />
            </TouchableOpacity>
            <Text className="text-[10px] font-bold uppercase tracking-[0.2em] text-foreground-tertiary">
              {config.subtitle}
            </Text>
            <View className="w-10" />
          </View>

          <Text className="font-playfair-bold text-3xl text-foreground-heading text-center mb-8">
            {config.title}
          </Text>

          <View className="flex-1">
            {renderMethodInput()}

            {/* SUBMIT ACTION */}
            <View className="mt-auto" style={{ marginBottom: insets.bottom + 20 }}>
              <TouchableOpacity
                onPress={handleExtract}
                disabled={!canSubmit || isSubmitting}
                className={`w-full h-14 bg-primary rounded-full flex-row items-center justify-center gap-3 shadow-lg shadow-primary/20 ${
                  !canSubmit || isSubmitting ? "opacity-50" : ""
                }`}
              >
                <Text className="text-white text-sm font-bold tracking-widest uppercase">
                  {isSubmitting
                    ? t("extraction.methodScreen.processing")
                    : t("extraction.methodScreen.draftRecipe")}
                </Text>
                {!isSubmitting && <ArrowRight size={16} color="#fff" weight="bold" />}
              </TouchableOpacity>
            </View>
          </View>
        </Animated.View>
      </KeyboardAvoidingView>
    </View>
  );
}
