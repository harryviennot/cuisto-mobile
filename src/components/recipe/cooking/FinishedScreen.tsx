import React, { useState, useEffect } from "react";
import { View, Text, Pressable, StatusBar, StyleSheet } from "react-native";
import { Image } from "expo-image";
import { BlurView } from "expo-blur";
import { Check, Star, Camera, Share as ShareIcon } from "phosphor-react-native";
import { useTranslation } from "react-i18next";
import Animated, {
    FadeIn,
    FadeInDown,
    useSharedValue,
    useAnimatedStyle,
    withRepeat,
    withTiming,
    withSequence,
    withSpring,
    ZoomIn
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import type { Recipe } from "@/types/recipe";

interface FinishedScreenProps {
    recipe: Recipe;
    onClose: () => void;
}

export const FinishedScreen: React.FC<FinishedScreenProps> = ({ recipe, onClose }) => {
    const { t } = useTranslation();
    const [rating, setRating] = useState(0);

    // Animations
    const pulseAnim = useSharedValue(1);

    useEffect(() => {
        pulseAnim.value = withRepeat(
            withSequence(
                withTiming(1.05, { duration: 1000 }),
                withTiming(1, { duration: 1000 })
            ),
            -1,
            true
        );
    }, []);

    const pulseStyle = useAnimatedStyle(() => ({
        transform: [{ scale: pulseAnim.value }],
    }));

    const handleRating = (star: number) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setRating(star);
    };

    const handleAction = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        // Placeholder for future implementation
    };

    return (
        <View className="flex-1 items-center justify-center bg-stone-900 relative">
            <StatusBar barStyle="light-content" />

            {/* Background Image with Blur */}
            <View className="absolute inset-0 opacity-60">
                <Image
                    source={{ uri: recipe.image_url }}
                    style={{ width: "100%", height: "100%" }}
                    contentFit="cover"
                />
                <BlurView intensity={60} tint="dark" style={StyleSheet.absoluteFill} />
            </View>

            <Animated.View
                entering={FadeInDown.duration(700).springify()}
                className="relative z-20 flex flex-col items-center justify-center w-full p-8"
            >
                {/* Hero Image with Badge */}
                <Animated.View
                    entering={ZoomIn.delay(200).duration(500)}
                    className="relative mb-8 group"
                >
                    {/* Glow effect */}
                    <Animated.View
                        className="absolute inset-0 bg-primary/30 rounded-full blur-2xl"
                        style={pulseStyle}
                    />

                    <View className="w-40 h-40 rounded-full border-[6px] border-white/10 shadow-2xl overflow-hidden relative z-10 bg-stone-800">
                        <Image
                            source={{ uri: recipe.image_url }}
                            style={{ width: "100%", height: "100%" }}
                            contentFit="cover"
                        />
                    </View>

                    <Animated.View
                        entering={ZoomIn.delay(600).springify()}
                        className="absolute -bottom-2 -right-2 w-14 h-14 bg-primary text-white rounded-full flex items-center justify-center shadow-lg border-4 border-stone-900"
                    >
                        <Check size={28} color="white" weight="bold" />
                    </Animated.View>
                </Animated.View>

                {/* Titles */}
                <View className="items-center mb-10 space-y-2">
                    <Animated.Text
                        entering={FadeInDown.delay(400).duration(500)}
                        className="font-playfair text-5xl text-white tracking-tight text-center"
                        style={{ fontFamily: "PlayfairDisplay_700Bold" }}
                    >
                        {t("common.bonAppetit")}
                    </Animated.Text>
                    <Animated.Text
                        entering={FadeInDown.delay(500).duration(500)}
                        className="text-white/60 font-medium text-lg text-center"
                    >
                        {t("recipe.cookingMode.mastered")} <Text className="text-white font-playfair italic" style={{ fontFamily: "PlayfairDisplay_700Bold" }}>{recipe.title}</Text>
                    </Animated.Text>
                </View>

                {/* Interaction Card */}
                <Animated.View
                    entering={FadeInDown.delay(600).duration(600).springify()}
                    className="w-full max-w-sm overflow-hidden rounded-3xl border border-white/10 shadow-2xl"
                >
                    <BlurView intensity={30} tint="light" className="p-6 bg-white/5">

                        {/* Rating */}
                        <View className="flex flex-col items-center mb-6">
                            <Text className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/40 mb-3">
                                {t("recipe.rateRecipe")}
                            </Text>
                            <View className="flex-row justify-center gap-3">
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <Pressable
                                        key={star}
                                        onPress={() => handleRating(star)}
                                        className="active:scale-75 transition-transform"
                                    >
                                        <Star
                                            size={32}
                                            color={rating >= star ? "#fbbf24" : "rgba(255,255,255,0.2)"}
                                            weight={rating >= star ? "fill" : "regular"}
                                        />
                                    </Pressable>
                                ))}
                            </View>
                        </View>

                        {/* Secondary Actions */}
                        <View className="flex-row gap-3 mb-6">
                            <Pressable
                                onPress={handleAction}
                                className="flex-1 flex-row items-center justify-center gap-2 py-3 rounded-xl bg-white/5 border border-white/5 active:bg-white/10"
                            >
                                <Camera size={16} color="rgba(255,255,255,0.8)" weight="bold" />
                                <Text className="text-white/80 text-xs font-bold uppercase tracking-wide">
                                    {t("common.photo")}
                                </Text>
                            </Pressable>
                            <Pressable
                                onPress={handleAction}
                                className="flex-1 flex-row items-center justify-center gap-2 py-3 rounded-xl bg-white/5 border border-white/5 active:bg-white/10"
                            >
                                <ShareIcon size={16} color="rgba(255,255,255,0.8)" weight="bold" />
                                <Text className="text-white/80 text-xs font-bold uppercase tracking-wide">
                                    {t("common.share")}
                                </Text>
                            </Pressable>
                        </View>

                        {/* Complete Button */}
                        <Pressable
                            onPress={() => {
                                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                                onClose();
                            }}
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
