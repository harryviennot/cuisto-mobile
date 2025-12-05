import React, { useState, useEffect, useRef } from "react";
import { View, Text, Pressable, Alert, ActivityIndicator } from "react-native";
import { Image } from "expo-image";
import { BlurView } from "expo-blur";
import { CheckIcon, CameraIcon, ShareIcon } from "phosphor-react-native";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { recipeService, uploadService } from "@/api/services";
import Animated, {
  FadeInDown,
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  ZoomIn,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import type { Recipe } from "@/types/recipe";
import { StarRating } from "@/components/StarRating";
import { useMarkRecipeAsCooked } from "@/hooks/useCookingHistory";
import { useCookingSession } from "@/contexts/CookingSessionContext";
import { useImagePicker, type PickedImage } from "@/hooks/useImagePicker";

interface FinishedScreenProps {
  recipe: Recipe;
  onClose: () => void;
}

export const FinishedScreen: React.FC<FinishedScreenProps> = ({ recipe, onClose }) => {
  const { t } = useTranslation();

  // Subscribe to cache updates for this recipe
  const { data: cachedRecipe } = useQuery({
    queryKey: ["recipe", recipe.id],
    queryFn: () => recipeService.getRecipe(recipe.id),
    initialData: recipe,
    staleTime: Infinity, // Use cached data, don't refetch
  });

  // Rating state - start with existing user rating or 0
  const [rating, setRating] = useState(cachedRecipe.user_data?.rating || 0);
  const ratingRef = useRef(rating); // Track current rating for completion

  // Photo state
  const [cookingPhoto, setCookingPhoto] = useState<PickedImage | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedPhotoUrl, setUploadedPhotoUrl] = useState<string | null>(null);

  // Image picker hook
  const { pickSingleImage } = useImagePicker();

  // Update ref when rating changes
  useEffect(() => {
    ratingRef.current = rating;
  }, [rating]);

  // Update local rating state when cache updates
  useEffect(() => {
    if (cachedRecipe.user_data?.rating !== undefined) {
      setRating(cachedRecipe.user_data.rating);
    }
  }, [cachedRecipe.user_data?.rating]);

  // Cooking session for duration tracking
  const { getElapsedMinutes, endSession } = useCookingSession();

  // Mark recipe as cooked mutation
  const markAsCookedMutation = useMarkRecipeAsCooked();

  // Animations
  const pulseAnim = useSharedValue(1);

  useEffect(() => {
    pulseAnim.value = withRepeat(
      withSequence(withTiming(1.05, { duration: 1000 }), withTiming(1, { duration: 1000 })),
      -1,
      true
    );
  }, [pulseAnim]);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseAnim.value }],
  }));

  const handleRating = (newRating: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    // Update UI immediately - the actual API call happens on completion
    setRating(newRating);
  };

  const handleTakePhoto = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    // Launch camera directly
    const image = await pickSingleImage("camera");
    if (image) {
      setCookingPhoto(image);

      // Start upload immediately
      setIsUploading(true);
      try {
        const result = await uploadService.uploadCookingPhoto(image);
        setUploadedPhotoUrl(result.url);
        console.log("[FinishedScreen] Photo uploaded successfully:", result.url);
      } catch (error) {
        console.error("Failed to upload cooking photo:", error);
        Alert.alert(
          t("common.error"),
          t("recipe.cookingMode.photoUploadFailed")
        );
        setCookingPhoto(null);
      } finally {
        setIsUploading(false);
      }
    }
  };

  const handleComplete = async () => {
    // Prevent closing while uploading
    if (isUploading) {
      Alert.alert(
        t("common.pleaseWait"),
        t("recipe.cookingMode.uploadingPhoto")
      );
      return;
    }

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    // Get cooking duration from session
    const durationMinutes = getElapsedMinutes();
    console.log("[FinishedScreen] handleComplete - durationMinutes:", durationMinutes, "rating:", ratingRef.current, "imageUrl:", uploadedPhotoUrl);

    // Mark recipe as cooked with rating, duration, and photo
    try {
      await markAsCookedMutation.mutateAsync({
        recipeId: recipe.id,
        params: {
          rating: ratingRef.current > 0 ? ratingRef.current : undefined,
          durationMinutes: durationMinutes > 0 ? durationMinutes : undefined,
          imageUrl: uploadedPhotoUrl || undefined,
        },
      });
    } catch (error) {
      // Log error but don't block the user from closing
      console.error("Failed to mark recipe as cooked:", error);
    }

    // End the cooking session
    endSession();

    // Close the cooking mode
    onClose();
  };

  const handleShare = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    // Placeholder for future implementation
  };

  return (
    <View className="flex-1 items-center justify-center">
      <Animated.View
        entering={FadeInDown.duration(700).springify()}
        className="relative z-20 flex flex-col items-center justify-center w-full p-8"
      >
        {/* Hero Image with Badge */}
        <Animated.View entering={ZoomIn.delay(400).duration(500)} className="relative mb-12 group">
          {/* Glow effect */}
          <Animated.View
            className="absolute inset-0 bg-primary/30 rounded-full blur-2xl"
            style={pulseStyle}
          />

          <View className="w-48 h-48 rounded-full border-[6px] border-white/10 shadow-2xl overflow-hidden relative z-10 bg-stone-800">
            <Image
              source={{ uri: cachedRecipe.image_url }}
              style={{ width: "100%", height: "100%", borderRadius: 500 }}
              contentFit="cover"
            />
          </View>

          <Animated.View
            entering={ZoomIn.delay(600).springify()}
            className="absolute -bottom-2 -right-2 w-16 h-16 bg-primary text-white rounded-full flex items-center justify-center shadow-lg border-4 border-stone-900 z-20"
          >
            <CheckIcon size={32} color="white" weight="bold" />
          </Animated.View>
        </Animated.View>

        <View className="items-center mb-10 space-y-2">
          <Animated.Text
            entering={FadeInDown.delay(200).duration(500)}
            className="font-playfair text-5xl text-white tracking-tight text-center"
            style={{ fontFamily: "PlayfairDisplay_700Bold" }}
          >
            {t("common.bonAppetit")}
          </Animated.Text>
          <Animated.Text
            entering={FadeInDown.delay(300).duration(500)}
            className="text-white/60 font-medium text-lg text-center"
          >
            {t("recipe.cookingMode.mastered")}{" "}
            <Text
              className="text-white font-playfair italic"
              style={{ fontFamily: "PlayfairDisplay_700Bold" }}
            >
              {cachedRecipe.title}
            </Text>
          </Animated.Text>
        </View>

        {/* Interaction Card */}
        <Animated.View
          entering={FadeInDown.delay(600).duration(600).springify()}
          className="w-full max-w-sm overflow-hidden rounded-3xl border border-white/10 shadow-2xl"
        >
          <BlurView intensity={20} tint="light" className="p-6 bg-white/10">
            {/* Rating */}
            <View className="flex flex-col items-center mb-6">
              <Text className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/60 mb-3">
                {t("recipe.rateRecipe")}
              </Text>
              <View className="flex-row justify-center">
                <StarRating
                  rating={rating}
                  onRatingChange={handleRating}
                  size={36}
                  editable={true}
                  gap={1}
                />
              </View>
            </View>

            {/* Secondary Actions */}
            <View className="flex-row gap-3 mb-6">
              <Pressable
                onPress={handleTakePhoto}
                disabled={isUploading}
                className={`flex-1 flex-row items-center justify-center gap-2 py-3 rounded-xl border ${
                  cookingPhoto
                    ? "bg-primary/20 border-primary/30"
                    : "bg-white/10 border-white/5"
                } ${isUploading ? "opacity-50" : "active:bg-white/20"}`}
              >
                {isUploading ? (
                  <ActivityIndicator size="small" color="rgba(255,255,255,0.9)" />
                ) : cookingPhoto ? (
                  <CheckIcon size={18} color="#22c55e" weight="bold" />
                ) : (
                  <CameraIcon size={18} color="rgba(255,255,255,0.9)" weight="bold" />
                )}
                <Text className="text-white/90 text-xs font-bold uppercase tracking-wide">
                  {isUploading
                    ? t("common.uploading")
                    : cookingPhoto
                      ? t("recipe.cookingMode.photoAdded")
                      : t("common.photo")}
                </Text>
              </Pressable>
              <Pressable
                onPress={handleShare}
                className="flex-1 flex-row items-center justify-center gap-2 py-3 rounded-xl bg-white/10 border border-white/5 active:bg-white/20"
              >
                <ShareIcon size={18} color="rgba(255,255,255,0.9)" weight="bold" />
                <Text className="text-white/90 text-xs font-bold uppercase tracking-wide">
                  {t("common.share")}
                </Text>
              </Pressable>
            </View>

            {/* Complete Button */}
            <Pressable
              onPress={handleComplete}
              className="w-full py-4 bg-white rounded-xl shadow-xl shadow-white/5 active:bg-stone-200 active:scale-95 transition-all"
            >
              <Text className="text-stone-900 text-center font-bold text-base uppercase tracking-widest">
                {t("recipe.cookingMode.completeSession")}
              </Text>
            </Pressable>
          </BlurView>
        </Animated.View>
      </Animated.View>
    </View>
  );
};
