/**
 * Unified Sticky Header
 *
 * A flexible animated sticky header with blur effect that fades in as the user scrolls.
 * Supports customizable left/right elements and optional title.
 * Reusable across all pages (home, library, recipe detail, collections).
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

export interface UnifiedStickyHeaderProps {
  /** Title to display in the header when scrolled (optional - recipe detail won't use it) */
  title?: string;
  /** Shared scroll position value from the parent scroll handler */
  scrollY: SharedValue<number>;
  /** Scroll position where animation starts (default: 0) */
  scrollThresholdStart?: number;
  /** Scroll position where animation ends (default: 100) */
  scrollThresholdEnd?: number;
  /** Callback when back button is pressed (shows default back button if provided) */
  onBackPress?: () => void;
  /** Custom left element (overrides default back button) */
  leftElement?: React.ReactNode;
  /** Element(s) to display on the right side */
  rightElement?: React.ReactNode;
  /** Whether to show border at bottom (default: true) */
  showBorder?: boolean;
}

export function UnifiedStickyHeader({
  title,
  scrollY,
  scrollThresholdStart = 0,
  scrollThresholdEnd = 100,
  onBackPress,
  leftElement,
  rightElement,
  showBorder = true,
}: UnifiedStickyHeaderProps) {
  const insets = useSafeAreaInsets();

  // Animated styles for header background (blur + color overlay)
  const headerBackgroundStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      scrollY.value,
      [scrollThresholdStart, scrollThresholdEnd],
      [0, 1],
      Extrapolation.CLAMP
    ),
  }));

  // Animated props for blur intensity
  const headerBlurProps = useAnimatedProps(() => ({
    intensity: interpolate(
      scrollY.value,
      [scrollThresholdStart, scrollThresholdEnd],
      [0, 90],
      Extrapolation.CLAMP
    ),
  }));

  // Animated styles for header title (fade in + slide up)
  // Title animation starts slightly after background for staggered effect
  const titleThresholdStart = scrollThresholdStart + 60;
  const titleThresholdEnd = scrollThresholdEnd + 20;

  const headerTitleStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      scrollY.value,
      [titleThresholdStart, titleThresholdEnd],
      [0, 1],
      Extrapolation.CLAMP
    ),
    transform: [
      {
        translateY: interpolate(
          scrollY.value,
          [titleThresholdStart, titleThresholdEnd],
          [20, 0],
          Extrapolation.CLAMP
        ),
      },
    ],
  }));

  // Default back button
  const defaultLeftElement = onBackPress ? (
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
  ) : (
    <View className="w-10" /> // Spacer when no left element
  );

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
        {showBorder && (
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
        )}
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
        {/* Left Element */}
        {leftElement !== undefined ? leftElement : defaultLeftElement}

        {/* Center Title (optional) */}
        {title && (
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
        )}

        {/* Right Element - fades in with title */}
        {rightElement ? (
          <Animated.View style={[headerTitleStyle, { zIndex: 20 }]}>
            {rightElement}
          </Animated.View>
        ) : (
          <View className="w-10" /> // Spacer to balance left element if no right element
        )}
      </View>
    </View>
  );
}
