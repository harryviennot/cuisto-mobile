import React, { useEffect } from "react";
import { View, ViewStyle } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
} from "react-native-reanimated";

interface SkeletonProps {
  width?: number | string;
  height?: number | string;
  borderRadius?: number;
  style?: ViewStyle;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  width = "100%",
  height = 20,
  borderRadius = 8,
  style,
}) => {
  const opacity = useSharedValue(0.3);

  useEffect(() => {
    opacity.value = withRepeat(
      withSequence(
        withTiming(1, {
          duration: 800,
          easing: Easing.inOut(Easing.ease),
        }),
        withTiming(0.3, {
          duration: 800,
          easing: Easing.inOut(Easing.ease),
        })
      ),
      -1,
      false
    );
  }, [opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        {
          width: width as any,
          height: height as any,
          borderRadius,
          backgroundColor: "#E1E4E8",
        },
        animatedStyle,
        style,
      ]}
    />
  );
};

interface SkeletonGroupProps {
  count?: number;
  width?: number | string;
  height?: number | string;
  borderRadius?: number;
  spacing?: number;
  className?: string;
}

export const SkeletonGroup: React.FC<SkeletonGroupProps> = ({
  count = 3,
  width = "100%",
  height = 20,
  borderRadius = 8,
  spacing = 12,
  className,
}) => {
  return (
    <View className={className}>
      {Array.from({ length: count }).map((_, index) => (
        <Skeleton
          key={index}
          width={width}
          height={height}
          borderRadius={borderRadius}
          style={{ marginBottom: index < count - 1 ? spacing : 0 }}
        />
      ))}
    </View>
  );
};
