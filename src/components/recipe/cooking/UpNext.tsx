import React from "react";
import { View, Text } from "react-native";
import { useTranslation } from "react-i18next";
import Animated, {
    SharedValue,
    useAnimatedStyle,
    interpolate,
    useDerivedValue,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface UpNextProps {
    nextStep: any;
    currentStep: number;
    totalSteps: number;
    nextStepAnim: SharedValue<number>;
    directionAnim: SharedValue<number>;
}

export const UpNext: React.FC<UpNextProps> = ({
    nextStep,
    currentStep,
    totalSteps,
    nextStepAnim,
    directionAnim,
}) => {
    const { t } = useTranslation();
    const insets = useSafeAreaInsets();

    const nextStepAnimatedStyle = useAnimatedStyle(() => {
        if (currentStep === totalSteps - 1) {
            return { opacity: 0, transform: [{ translateY: 10 }] };
        }
        return {
            transform: [
                { translateY: interpolate(nextStepAnim.value, [-1, 0, 1], [-10, 0, 10]) },
            ],
            opacity: interpolate(nextStepAnim.value, [-1, 0, 1], [0, 1, 0]),
        };
    }, [currentStep, totalSteps]);

    const labelOpacity = useDerivedValue(() => {
        // If we are at the last step, force hide
        if (currentStep === totalSteps - 1) {
            return 0;
        }

        // Animate label out only when moving to the last step AND going forward
        if (currentStep === totalSteps - 2 && nextStepAnim.value > 0 && directionAnim.value !== -1) {
            return interpolate(nextStepAnim.value, [0, 1], [1, 0]);
        }
        return 1;
    }, [currentStep, totalSteps]);

    const labelTranslateY = useDerivedValue(() => {
        if (currentStep === totalSteps - 1) {
            return 10;
        }

        if (currentStep === totalSteps - 2 && nextStepAnim.value > 0 && directionAnim.value !== -1) {
            return interpolate(nextStepAnim.value, [0, 1], [0, 10]);
        }
        return 0;
    }, [currentStep, totalSteps]);

    const labelAnimatedStyle = useAnimatedStyle(() => {
        return {
            opacity: labelOpacity.value,
            transform: [{ translateY: labelTranslateY.value }],
        };
    });

    // Persist the next step to allow exit animation
    const lastNextStep = React.useRef(nextStep);
    if (nextStep) {
        lastNextStep.current = nextStep;
    }
    const stepToShow = nextStep || lastNextStep.current;

    if (!stepToShow) return null;

    return (
        <View
            className="items-center justify-center px-8 py-4 w-full"
        >
            <Animated.Text
                style={labelAnimatedStyle}
                className="mb-1 text-center text-[10px] font-bold uppercase tracking-widest text-white/60"
            >
                {t("common.upNext")}
            </Animated.Text>
            <Animated.View style={nextStepAnimatedStyle}>
                <Text
                    className="truncate text-center font-playfair text-xl text-white/90"
                    numberOfLines={1}
                >
                    {stepToShow.title}
                </Text>
            </Animated.View>
        </View>
    );
};
