/**
 * Collection Sticky Header
 *
 * Animated sticky header with blur effect, back button, and animated title.
 * The header background and title fade in as the user scrolls down.
 * Reusable across all collection detail pages.
 */
import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ArrowLeft } from "phosphor-react-native";
import Animated, {
  useAnimatedStyle,
  useAnimatedProps,
  interpolate,
  Extrapolation,
  SharedValue,
} from "react-native-reanimated";
import { BlurView } from "expo-blur";

const AnimatedBlurView = Animated.createAnimatedComponent(BlurView);

export interface CollectionStickyHeaderProps {
  /** Title to display in the header when scrolled */
  title: string;
  /** Shared scroll position value from the parent scroll handler */
  scrollY: SharedValue<number>;
  /** Callback when back button is pressed */
  onBackPress: () => void;
  /** Optional element to display on the right side */
  rightElement?: React.ReactNode;
}

export function CollectionStickyHeader({
  title,
  scrollY,
  onBackPress,
  rightElement,
}: CollectionStickyHeaderProps) {
  const insets = useSafeAreaInsets();

  // Animated styles for header background (blur + color overlay)
  const headerBackgroundStyle = useAnimatedStyle(() => ({
    opacity: interpolate(scrollY.value, [0, 100], [0, 1], Extrapolation.CLAMP),
  }));

  // Animated props for blur intensity
  const headerBlurProps = useAnimatedProps(() => ({
    intensity: interpolate(scrollY.value, [0, 100], [0, 90], Extrapolation.CLAMP),
  }));

  // Animated styles for header title (fade in + slide up)
  const headerTitleStyle = useAnimatedStyle(() => ({
    opacity: interpolate(scrollY.value, [60, 120], [0, 1], Extrapolation.CLAMP),
    transform: [
      {
        translateY: interpolate(scrollY.value, [60, 120], [20, 0], Extrapolation.CLAMP),
      },
    ],
  }));

  return (
    <View
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 100,
      }}
    >
      {/* Animated Background Container (Blur + Color) */}
      <Animated.View
        style={[
          headerBackgroundStyle,
          {
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
          },
        ]}
      >
        {/* Layer 1: Progressive Blur */}
        <AnimatedBlurView
          tint="light"
          animatedProps={headerBlurProps}
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
          }}
        />

        {/* Layer 2: Color Overlay */}
        <View
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(244, 241, 232, 0.5)",
          }}
        />

        {/* Layer 3: Border */}
        <View
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            bottom: 0,
            height: 1,
            backgroundColor: "rgba(0,0,0,0.05)",
          }}
        />
      </Animated.View>

      {/* Header Content (Overlay) */}
      <View
        style={{
          paddingTop: insets.top,
          paddingHorizontal: 16,
          paddingBottom: 12,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <TouchableOpacity
          onPress={onBackPress}
          className="w-10 h-10 rounded-full items-center justify-center z-20"
          activeOpacity={0.7}
          style={{
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 4,
            elevation: 3,
          }}
        >
          <ArrowLeft size={24} color="#334d43" weight="bold" />
        </TouchableOpacity>

        <Animated.View
          style={[
            headerTitleStyle,
            {
              position: "absolute",
              left: 0,
              right: 0,
              bottom: 12, // Match paddingBottom
              alignItems: "center",
              justifyContent: "center",
              zIndex: 10,
            },
          ]}
          pointerEvents="none"
        >
          <Text className="text-xl text-foreground-heading" numberOfLines={1}>
            {title}
          </Text>
        </Animated.View>

        {rightElement ? (
          <View className="z-20">{rightElement}</View>
        ) : (
          <View className="w-10" /> // Spacer to balance back button if no right element
        )}
      </View>
    </View>
  );
}
