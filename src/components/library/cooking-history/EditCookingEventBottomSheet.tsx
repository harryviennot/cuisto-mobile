/**
 * Edit Cooking Event Bottom Sheet
 *
 * Modal for editing an existing cooking event.
 * Allows changing the date, rating, and image.
 */
import "@/global.css";
import { View, Text, Pressable, ActivityIndicator } from "react-native";
import { useRef, useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { BottomSheetModal, BottomSheetBackdrop, BottomSheetScrollView } from "@gorhom/bottom-sheet";
import { X, Camera, Trash, ImageSquare, Star } from "phosphor-react-native";
import { Image } from "expo-image";
import { useDeviceType } from "@/hooks/useDeviceType";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StarRating } from "@/components/StarRating";
import { useImagePicker } from "@/hooks/useImagePicker";
import { uploadService } from "@/api/services/upload.service";
import type { CookingHistoryEvent, UpdateCookingEventParams } from "@/types/cookingHistory";
import Toast from "react-native-toast-message";
import { BlurView } from "expo-blur";
import * as Haptics from "expo-haptics";
import { DatePickerBottomSheet } from "./DatePickerBottomSheet";

interface EditCookingEventBottomSheetProps {
  visible: boolean;
  event: CookingHistoryEvent | null;
  onSave: (params: UpdateCookingEventParams) => void;
  onClose: () => void;
  isSaving?: boolean;
}

export function EditCookingEventBottomSheet({
  visible,
  event,
  onSave,
  onClose,
  isSaving = false,
}: EditCookingEventBottomSheetProps) {
  const { t } = useTranslation();
  const bottomSheetModalRef = useRef<BottomSheetModal>(null);
  const { isTablet } = useDeviceType();
  const insets = useSafeAreaInsets();
  const { pickSingleImage, isPickingImage } = useImagePicker();

  // Local state for edits
  const [date, setDate] = useState<Date>(new Date());
  const [rating, setRating] = useState<number | undefined>(undefined);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [showDatePickerSheet, setShowDatePickerSheet] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [imageRemoved, setImageRemoved] = useState(false);

  // Reset state when event changes
  useEffect(() => {
    if (event) {
      setDate(new Date(event.cooked_at));
      setRating(event.rating);
      setImageUrl(event.cooking_image_url ?? null);
      setImageRemoved(false);
    }
  }, [event]);

  useEffect(() => {
    if (visible) {
      bottomSheetModalRef.current?.present();
    } else {
      bottomSheetModalRef.current?.dismiss();
    }
  }, [visible]);

  const renderBackdrop = useCallback(
    (props: React.ComponentProps<typeof BottomSheetBackdrop>) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
        opacity={0.4}
        pressBehavior="close"
      />
    ),
    []
  );

  const handleClose = () => {
    // Reset local state when closing without saving
    if (event) {
      setDate(new Date(event.cooked_at));
      setRating(event.rating);
      setImageUrl(event.cooking_image_url ?? null);
      setImageRemoved(false);
    }
    setShowDatePickerSheet(false);
    onClose();
  };

  const handleSave = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const params: UpdateCookingEventParams = {};

    // Only include fields that changed
    if (event) {
      const originalDate = new Date(event.cooked_at);
      if (date.getTime() !== originalDate.getTime()) {
        params.cookedAt = date.toISOString();
      }

      if (rating !== event.rating) {
        params.rating = rating;
      }

      // Image handling
      if (imageRemoved) {
        params.imageUrl = null;
      } else if (imageUrl !== event.cooking_image_url) {
        params.imageUrl = imageUrl;
      }
    }

    onSave(params);
  };

  const handleDateConfirm = (selectedDate: Date) => {
    setDate(selectedDate);
    setShowDatePickerSheet(false);
  };

  const handlePickImage = async (source: "camera" | "gallery") => {
    const image = await pickSingleImage(source);
    if (image) {
      setIsUploading(true);
      try {
        const result = await uploadService.uploadCookingPhoto(image);
        setImageUrl(result.url);
        setImageRemoved(false);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch (error) {
        console.error("Failed to upload image:", error);
        Toast.show({
          type: "error",
          text1: t("common.error"),
          text2: t("cookingHistory.uploadFailed"),
        });
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      } finally {
        setIsUploading(false);
      }
    }
  };

  const handleRemoveImage = () => {
    setImageUrl(null);
    setImageRemoved(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const formatDate = (d: Date) => {
    return d.toLocaleDateString(undefined, {
      weekday: "short",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const isLoading = isSaving || isUploading || isPickingImage;

  return (
    <>
      <BottomSheetModal
        ref={bottomSheetModalRef}
        enableDynamicSizing
        enablePanDownToClose
        onDismiss={handleClose}
        backdropComponent={renderBackdrop}
        backgroundStyle={{ backgroundColor: "#FEFCF8" }}
        handleIndicatorStyle={{ backgroundColor: "#E5E5E5", width: 40 }}
      >
        <BottomSheetScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
        >
          {/* Header */}
          <View className={`${isTablet ? "px-10" : "px-6"} pt-2 pb-6`}>
            <View className="flex-row items-center justify-between mb-2">
              <Text
                className="text-2xl text-foreground-heading"
                style={{ fontFamily: "PlayfairDisplay_700Bold" }}
              >
                {t("cookingHistory.editTitle")}
              </Text>
              <Pressable
                onPress={handleClose}
                hitSlop={10}
                className="w-8 h-8 rounded-full bg-stone-100 items-center justify-center"
              >
                <X size={16} color="#78716c" weight="bold" />
              </Pressable>
            </View>
            {event && (
              <Text className="text-sm text-foreground-muted font-medium" numberOfLines={1}>
                {event.recipe_title}
              </Text>
            )}
          </View>

          {/* Content */}
          <View className={`${isTablet ? "px-10" : "px-6"}`}>

            {/* Main Image Section - Hero Style */}
            <View className="mb-8 items-center">
              <View
                className="w-full aspect-[3/2] bg-stone-100 rounded-2xl overflow-hidden border border-border-light relative shadow-sm"
              >
                {isUploading ? (
                  <View className="absolute inset-0 items-center justify-center bg-stone-50">
                    <ActivityIndicator size="large" color="#334d43" />
                    <Text className="text-xs text-foreground-muted mt-3 font-medium tracking-wide uppercase">
                      {t("cookingHistory.uploading")}
                    </Text>
                  </View>
                ) : imageUrl ? (
                  <>
                    <Image
                      source={{ uri: imageUrl }}
                      style={{ width: "100%", height: "100%" }}
                      contentFit="cover"
                      transition={300}
                    />
                    {/* Overlay Actions */}
                    <View className="absolute bottom-3 right-3 flex-row gap-2">
                      <BlurView intensity={20} tint="dark" className="rounded-full overflow-hidden">
                        <Pressable
                          onPress={handleRemoveImage}
                          className="w-9 h-9 items-center justify-center bg-black/20"
                        >
                          <Trash size={16} color="white" weight="bold" />
                        </Pressable>
                      </BlurView>
                      <BlurView intensity={20} tint="dark" className="rounded-full overflow-hidden">
                        <Pressable
                          onPress={() => handlePickImage("gallery")}
                          className="w-9 h-9 items-center justify-center bg-black/20"
                        >
                          <ImageSquare size={16} color="white" weight="bold" />
                        </Pressable>
                      </BlurView>
                    </View>
                  </>
                ) : (
                  <Pressable
                    onPress={() => handlePickImage("gallery")}
                    className="w-full h-full items-center justify-center active:bg-stone-200 transition-colors"
                  >
                    <View className="w-16 h-16 rounded-full bg-stone-200 items-center justify-center mb-3">
                      <Camera size={24} color="#a8a29e" weight="duotone" />
                    </View>
                    <Text className="text-sm text-foreground-tertiary">
                      {t("cookingHistory.addPhoto")}
                    </Text>
                  </Pressable>
                )}
              </View>
            </View>

            {/* Form Fields - Clean Rows */}
            <View className="gap-6">

              {/* Date Input */}
              <View className="border-b border-border-light pb-4">
                <Text className="text-xs font-bold text-foreground-tertiary uppercase tracking-widest mb-3">
                  {t("cookingHistory.dateLabel")}
                </Text>
                <Pressable
                  onPress={() => setShowDatePickerSheet(true)}
                  className="flex-row items-center justify-between py-1 active:opacity-70"
                >
                  <Text className="text-lg font-medium text-foreground-heading font-serif">
                    {formatDate(date)}
                  </Text>
                  <Text className="text-sm text-primary font-medium">
                    {t("common.edit")}
                  </Text>
                </Pressable>
              </View>

              {/* Rating Input */}
              <View className="border-b border-border-light pb-6">
                <View className="flex-row items-center justify-between mb-4">
                  <Text className="text-xs font-bold text-foreground-tertiary uppercase tracking-widest">
                    {t("cookingHistory.ratingLabel")}
                  </Text>
                  {rating !== undefined && (
                    <Pressable onPress={() => {
                      setRating(undefined);
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    }}>
                      <Text className="text-xs text-foreground-muted">
                        {t("cookingHistory.clearRating")}
                      </Text>
                    </Pressable>
                  )}
                </View>

                <View className="items-center py-2">
                  <StarRating
                    rating={rating ?? 0}
                    onRatingChange={(r) => {
                      setRating(r);
                      Haptics.selectionAsync();
                    }}
                    editable={true}
                    size={42}
                    gap={16}
                  />
                </View>
              </View>

            </View>

            {/* Action Buttons */}
            <View className="mt-8 gap-3">
              <Pressable
                onPress={handleSave}
                disabled={isLoading}
                className={`w-full py-4 rounded-full flex-row items-center justify-center bg-primary active:opacity-90 ${isLoading ? "opacity-80" : ""}`}
                style={{
                  shadowColor: "#334d43",
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.2,
                  shadowRadius: 8,
                  elevation: 4,
                }}
              >
                {isSaving ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <Text className="text-base font-bold text-white tracking-wide">
                    {t("common.saveChanges")}
                  </Text>
                )}
              </Pressable>

              <Pressable
                onPress={handleClose}
                disabled={isLoading}
                className="w-full py-3 items-center justify-center active:bg-stone-50 rounded-full"
              >
                <Text className="text-base font-medium text-foreground-secondary">
                  {t("common.cancel")}
                </Text>
              </Pressable>
            </View>

          </View>
        </BottomSheetScrollView>
      </BottomSheetModal>

      {/* Date Picker Sheet */}
      <DatePickerBottomSheet
        visible={showDatePickerSheet}
        date={date}
        onConfirm={handleDateConfirm}
        onClose={() => setShowDatePickerSheet(false)}
      />
    </>
  );
}
