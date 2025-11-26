import React from "react";
import { View, Text } from "react-native";
import { useTranslation } from "react-i18next";
import Animated, {
    SharedValue,
    useAnimatedStyle,
    interpolate,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface UpNextProps {
    nextStep: any;
    currentStep: number;
    totalSteps: number;
    nextStepAnim: SharedValue<number>;
}

export const UpNext: React.FC<UpNextProps> = ({
    nextStep,
    currentStep,
    totalSteps,
    nextStepAnim,
}) => {
    const { t } = useTranslation();
    const insets = useSafeAreaInsets();

    const nextStepAnimatedStyle = useAnimatedStyle(() => {
        return {
            transform: [
                { translateY: interpolate(nextStepAnim.value, [-1, 0, 1], [-10, 0, 10]) },
            ],
            opacity: interpolate(nextStepAnim.value, [-1, 0, 1], [0, 1, 0]),
        };
    });

    const labelAnimatedStyle = useAnimatedStyle(() => {
        // Animate label out only when moving to the last step
        if (currentStep === totalSteps - 2 && nextStepAnim.value > 0) {
            return {
                opacity: interpolate(nextStepAnim.value, [0, 1], [1, 0]),
                transform: [
                    { translateY: interpolate(nextStepAnim.value, [0, 1], [0, 10]) },
                ],
            };
        }
        return { opacity: 1, transform: [{ translateY: 0 }] };
    }, [currentStep, totalSteps]);

    if (!nextStep) return null;

    return (
        <View
            className="items-center justify-center px-8 py-4 w-full"

        >
            <Animated.Text
                style={labelAnimatedStyle}
                className="mb-1 text-center text-[10px] uppercase tracking-widest text-white/60"
            >
                {t("common.upNext")}
            </Animated.Text>
            <Animated.View style={nextStepAnimatedStyle}>
                <Text
                    className="truncate text-center font-playfair text-base text-white/90"
                    numberOfLines={1}
                >

                    {nextStep.title}
                </Text>
            </Animated.View>
        </View>
    );
};
