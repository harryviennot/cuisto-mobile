import { View, Pressable } from "react-native";
import Animated, {
  useAnimatedStyle,
  interpolate,
  Extrapolation,
  SharedValue,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ArrowLeftIcon, DotsThreeIcon } from "phosphor-react-native";
import { ReactNode } from "react";

const HEADER_HEIGHT = 60;

interface AnimationConfig {
  scrollThresholdStart: number;
  scrollThresholdEnd: number;
  titleTranslateYStart: number;
  titleTranslateYEnd: number;
}

interface AnimatedPageHeaderProps {
  title: string;
  scrollY: SharedValue<number>;
  onBackPress?: () => void;
  onMenuPress?: () => void;
  leftButton?: ReactNode;
  rightButton?: ReactNode;
  animationConfig?: Partial<AnimationConfig>;
  backgroundColor?: string;
  borderColor?: string;
  titleClassName?: string;
}

export function AnimatedPageHeader({
  title,
  scrollY,
  onBackPress,
  onMenuPress,
  leftButton,
  rightButton,
  animationConfig,
  backgroundColor = "#f4f1e8",
  borderColor = "#d4c5a9",
  titleClassName = "text-xl text-foreground-heading text-bold",
}: AnimatedPageHeaderProps) {
  const { top } = useSafeAreaInsets();

  // Default animation config with ability to override
  const config: AnimationConfig = {
    scrollThresholdStart: top + 64 - 20,
    scrollThresholdEnd: top + 64 + 80,
    titleTranslateYStart: 10,
    titleTranslateYEnd: 0,
    ...animationConfig,
  };

  // Animated header background - fades in
  const headerAnimatedStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      scrollY.value,
      [config.scrollThresholdStart, config.scrollThresholdEnd],
      [0, 1],
      Extrapolation.CLAMP
    );

    return {
      opacity,
    };
  });

  // Animated header title - fades in and moves up
  const headerTitleAnimatedStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      scrollY.value,
      [config.scrollThresholdStart, config.scrollThresholdEnd],
      [0, 1],
      Extrapolation.CLAMP
    );

    const translateY = interpolate(
      scrollY.value,
      [config.scrollThresholdStart, config.scrollThresholdEnd],
      [config.titleTranslateYStart, config.titleTranslateYEnd],
      Extrapolation.CLAMP
    );

    return {
      opacity,
      transform: [{ translateY }],
    };
  });

  // Animated button background - fades out as header fades in
  const buttonBackgroundAnimatedStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      scrollY.value,
      [config.scrollThresholdStart, config.scrollThresholdEnd],
      [1, 0],
      Extrapolation.CLAMP
    );

    return {
      opacity,
    };
  });

  // Default buttons
  const defaultLeftButton = onBackPress ? (
    <View className="w-12 h-12 items-center justify-center">
      <Animated.View
        className="absolute w-12 h-12 rounded-full bg-white"
        style={[
          {
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.15,
            shadowRadius: 3,
          },
          buttonBackgroundAnimatedStyle,
        ]}
      />
      <Pressable onPress={onBackPress} className="w-12 h-12 items-center justify-center">
        <ArrowLeftIcon size={22} color="#334d43" weight="bold" />
      </Pressable>
    </View>
  ) : null;

  const defaultRightButton = onMenuPress ? (
    <View className="w-12 h-12 items-center justify-center">
      <Animated.View
        className="absolute w-12 h-12 rounded-full bg-white"
        style={[
          {
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.15,
            shadowRadius: 3,
          },
          buttonBackgroundAnimatedStyle,
        ]}
      />
      <Pressable onPress={onMenuPress} className="w-12 h-12 items-center justify-center">
        <DotsThreeIcon size={22} color="#334d43" weight="bold" />
      </Pressable>
    </View>
  ) : null;

  return (
    <>
      {/* Fixed Buttons Layer - Always visible above header */}
      <View
        className="absolute left-6 right-6 z-50 flex-row items-center justify-between"
        style={{ top: top + 8 }}
      >
        {leftButton !== undefined ? leftButton : defaultLeftButton}
        {rightButton !== undefined ? rightButton : defaultRightButton}
      </View>

      {/* Sticky Header - Fades in when content scrolls */}
      <Animated.View
        className="absolute top-0 left-0 right-0 z-40 border-b"
        style={[
          {
            height: HEADER_HEIGHT + top,
            paddingTop: top,
            backgroundColor,
            borderBottomColor: borderColor,
          },
          headerAnimatedStyle,
        ]}
      >
        <View className="flex-1 mx-20 flex-row items-center justify-center">
          <Animated.Text
            className={titleClassName}
            style={[headerTitleAnimatedStyle]}
            numberOfLines={1}
            ellipsizeMode={"tail"}
          >
            {title}
          </Animated.Text>
        </View>
      </Animated.View>
    </>
  );
}
