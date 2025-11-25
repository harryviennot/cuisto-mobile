import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { ToastConfig } from "react-native-toast-message";
import { CheckCircle, WarningCircle, Info, X, CheckCircleIcon, WarningCircleIcon, InfoIcon, WarningDiamondIcon } from "phosphor-react-native";
import Toast from "react-native-toast-message";
import { useDeviceType } from "@/hooks/useDeviceType";

const ToastLayout = ({
    text1,
    text2,
    type,
    icon: Icon,
    color,
    bgColor = "bg-surface-elevated",
}: {
    text1?: string;
    text2?: string;
    type: "success" | "error" | "info" | "warning";
    icon: any;
    color: string;
    bgColor?: string;
}) => {
    const { isTablet, isTabletLandscape } = useDeviceType();
    return (
        <View
            className={`${isTablet ? (isTabletLandscape ? "w-[60%]" : "mx-10") : "mx-4"} flex-row items-center rounded-2xl ${bgColor} p-4 shadow-xl shadow-black/10 border border-border-light`}
        >
            <View
                className="mr-4 h-10 w-10 items-center justify-center rounded-full"
                style={{ backgroundColor: `${color}15` }} // 15% opacity of the color
            >
                <Icon size={24} color={color} weight="fill" />
            </View>
            <View className="flex-1">
                {text1 && (
                    <Text className="text-lg text-text-heading ">
                        {text1}
                    </Text>
                )}
                {text2 && (
                    <Text className="text-base text-text-body leading-5 mt-1">
                        {text2}
                    </Text>
                )}
            </View>
            <TouchableOpacity
                onPress={() => Toast.hide()}
                hitSlop={10}
                className="ml-2 p-1"
            >
                <X size={16} color="#a8a29e" />
            </TouchableOpacity>
        </View>
    );
};

export const toastConfig: ToastConfig = {
    success: ({ text1, text2 }) => (
        <ToastLayout
            text1={text1}
            text2={text2}
            type="success"
            icon={CheckCircleIcon}
            color="#507768" // primary.light / state.success
        />
    ),
    error: ({ text1, text2 }) => (
        <ToastLayout
            text1={text1}
            text2={text2}
            type="error"
            icon={WarningCircleIcon}
            color="#c65d47" // danger.DEFAULT
        />
    ),
    info: ({ text1, text2 }) => (
        <ToastLayout
            text1={text1}
            text2={text2}
            type="info"
            icon={InfoIcon}
            color="#334d43" // primary.DEFAULT
        />
    ),
    warning: ({ text1, text2 }) => (
        <ToastLayout
            text1={text1}
            text2={text2}
            type="warning"
            icon={WarningDiamondIcon}
            // orange color DEFAULT
            color="#f59e0b"
        />
    ),
};
