import React from "react";
import { View, Text, Pressable } from "react-native";
import { CaretLeft, CaretRight, ArrowUp } from "phosphor-react-native";
import { useTranslation } from "react-i18next";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface CookingControlsProps {
    currentStep: number;
    totalSteps: number;
    isIngredientsOpen: boolean;
    onChangeStep: (direction: "next" | "prev") => void;
    onToggleIngredients: () => void;
    onLayout?: (height: number) => void;
}

export const CookingControls: React.FC<CookingControlsProps> = ({
    currentStep,
    totalSteps,
    isIngredientsOpen,
    onChangeStep,
    onToggleIngredients,
    onLayout,
}) => {
    const { t } = useTranslation();
    const insets = useSafeAreaInsets();

    return (
        <View
            className="z-50 flex-row items-stretch gap-4 border-t border-white/10 bg-black/80 px-6 pb-8 pt-6 backdrop-blur-lg"
            style={{ paddingBottom: insets.bottom + 16 }}
            onLayout={(event) => {
                const { height } = event.nativeEvent.layout;
                onLayout?.(height);
            }}
        >
            <Pressable
                onPress={() => onChangeStep("prev")}
                disabled={currentStep === 0}
                className={`h-16 w-16 items-center justify-center rounded-2xl bg-white/10 active:scale-95 ${currentStep === 0 ? "opacity-20" : "opacity-100"
                    }`}
            >
                <CaretLeft size={28} color="white" />
            </Pressable>

            <Pressable
                onPress={onToggleIngredients}
                className={`flex-1 flex-col items-center justify-center gap-1 rounded-2xl border active:scale-95 transition-all ${isIngredientsOpen
                        ? "bg-white border-white"
                        : "bg-transparent border-white/30"
                    }`}
            >
                <Text
                    className={`text-[10px] font-bold uppercase tracking-wider ${isIngredientsOpen ? "text-black" : "text-white"
                        }`}
                >
                    {t("recipe.ingredients")}
                </Text>
                <ArrowUp
                    size={16}
                    color={isIngredientsOpen ? "black" : "white"}
                    style={{ transform: [{ rotate: isIngredientsOpen ? "180deg" : "0deg" }] }}
                />
            </Pressable>

            <Pressable
                onPress={() => onChangeStep("next")}
                className="h-16 flex-[2] flex-row items-center justify-center gap-2 rounded-2xl bg-white shadow-lg active:scale-95"
            >
                <Text className="text-lg font-bold text-primary">
                    {currentStep === totalSteps - 1
                        ? t("common.finish")
                        : t("common.next")}
                </Text>
                <CaretRight size={24} color="#334d43" weight="bold" />
            </Pressable>
        </View>
    );
};
