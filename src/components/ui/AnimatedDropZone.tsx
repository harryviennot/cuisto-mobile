import React, { useEffect, useState } from "react";
import { View, ViewProps, LayoutChangeEvent } from "react-native";
import Svg, { Rect } from "react-native-svg";
import Animated, {
    useSharedValue,
    useAnimatedProps,
    withRepeat,
    withTiming,
    Easing,
    cancelAnimation,
} from "react-native-reanimated";
import { cn } from "@/utils/cn";

const AnimatedRect = Animated.createAnimatedComponent(Rect);

type AnimatedDropZoneProps = {
    children?: React.ReactNode;
    className?: string;
    variant?: "default" | "primary";
} & ViewProps;

const variants = {
    default: {
        className: "bg-white/50",
        stroke: "#d4c5a9",
        strokeWidth: 1.5,
    },
    primary: {
        className: "bg-primary/10",
        stroke: "#334d43",
        strokeWidth: 1.5,
    },
};

export function AnimatedDropZone({
    children,
    className,
    variant = "default",
    style,
    ...props
}: AnimatedDropZoneProps) {
    const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
    const progress = useSharedValue(0);

    const variantProps = variants[variant];

    useEffect(() => {
        progress.value = withRepeat(
            withTiming(1, {
                duration: 3000,
                easing: Easing.linear,
            }),
            -1, // Infinite repeat
            false // Do not reverse
        );
        return () => {
            cancelAnimation(progress);
        };
    }, []);

    const animatedProps = useAnimatedProps(() => {
        // We want the dash to move around the perimeter.
        // A simple way is to animate strokeDashoffset.
        // The offset should change by the length of the dash pattern repeat to look seamless,
        // or just a large number if we don't care about the loop point matching exactly (but we do for smoothness).
        // Let's assume a dash pattern of [10, 10] -> total 20.
        // We want to shift by 20 units.
        return {
            strokeDashoffset: -progress.value * 96, // Move by 96 units per cycle (6 patterns of 16)
        };
    });

    const onLayout = (event: LayoutChangeEvent) => {
        const { width, height } = event.nativeEvent.layout;
        setDimensions({ width, height });
    };

    return (
        <View
            className={cn(
                "relative overflow-hidden rounded-xl justify-center items-center py-4 px-6",
                variantProps.className,
                className
            )}
            onLayout={onLayout}
            style={style}
            {...props}
        >
            {dimensions.width > 0 && dimensions.height > 0 && (
                <View className="absolute inset-0 pointer-events-none">
                    <Svg width="100%" height="100%">
                        <AnimatedRect
                            x="2"
                            y="2"
                            width={dimensions.width - 4}
                            height={dimensions.height - 4}
                            rx="10" // Matching rounded-xl approx (12px usually, minus padding)
                            ry="10"
                            stroke={variantProps.stroke}
                            strokeWidth={variantProps.strokeWidth}
                            strokeDasharray="8, 8"
                            fill="none"
                            animatedProps={animatedProps}
                        />
                    </Svg>
                </View>
            )}
            {children}
        </View>
    );
}
