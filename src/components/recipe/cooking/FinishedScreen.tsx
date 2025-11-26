import React from "react";
import { View, Text, Pressable, StatusBar } from "react-native";
import { Check } from "phosphor-react-native";
import { useTranslation } from "react-i18next";
import Animated, { FadeIn } from "react-native-reanimated";

interface FinishedScreenProps {
    title: string;
    onClose: () => void;
}

export const FinishedScreen: React.FC<FinishedScreenProps> = ({ title, onClose }) => {
    const { t } = useTranslation();

    return (
        <View className="flex-1 items-center justify-center bg-[#FDFBF7] px-8">
            <StatusBar barStyle="dark-content" />
            <Animated.View entering={FadeIn.duration(500)} className="items-center">
                <View className="mb-8 h-24 w-24 items-center justify-center rounded-full bg-primary shadow-xl shadow-primary/20">
                    <Check size={48} color="white" weight="bold" />
                </View>
                <Text
                    className="mb-4 text-center font-playfair text-4xl text-foreground-heading"
                    style={{ fontFamily: "PlayfairDisplay_700Bold" }}
                >
                    {t("common.bonAppetit")}
                </Text>
                <Text className="mb-12 text-center text-lg text-foreground-secondary">
                    {t("recipe.cookingMode.finishedMessage", { title })}
                </Text>

                <View className="w-full flex-row gap-4">
                    <Pressable
                        onPress={onClose}
                        className="flex-1 rounded-xl bg-surface-elevated py-4 active:opacity-80"
                    >
                        <Text className="text-center text-lg font-bold text-foreground-heading">
                            {t("common.close")}
                        </Text>
                    </Pressable>
                    <Pressable
                        onPress={onClose}
                        className="flex-1 rounded-xl bg-primary py-4 shadow-lg active:opacity-80"
                    >
                        <Text className="text-center text-lg font-bold text-white">
                            {t("recipe.rateRecipe")}
                        </Text>
                    </Pressable>
                </View>
            </Animated.View>
        </View>
    );
};
