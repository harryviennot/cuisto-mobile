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
import { ArrowLeftIcon } from "phosphor-react-native";
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
  /** Whether to show backdrop behind buttons before header is scrolled (default: false) */
  showButtonBackdrop?: boolean;
  /** Whether the right element is always visible or fades in with the header (default: false) */
  rightElementAlwaysVisible?: boolean;
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
  showButtonBackdrop = false,
  rightElementAlwaysVisible = false,
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

  // Animated styles for header title and right element (fade in + slide up)
  // Animation starts slightly after background for staggered effect
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

  // Animated styles for button backdrop (fades out as header fades in)
  const buttonBackdropStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      scrollY.value,
      [scrollThresholdStart, scrollThresholdEnd],
      [1, 0],
      Extrapolation.CLAMP
    ),
  }));

  // Default back button with optional backdrop
  const defaultLeftElement = onBackPress ? (
    <View className="w-11 h-11 items-center justify-center">
      {showButtonBackdrop && (
        <Animated.View
          className="absolute w-11 h-11 rounded-full"
          style={[
            {
              backgroundColor: "#f4f1e8",
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.15,
              shadowRadius: 3,
            },
            buttonBackdropStyle,
          ]}
        />
      )}
      <TouchableOpacity
        onPress={onBackPress}
        className="w-11 h-11 rounded-full items-center justify-center"
        activeOpacity={0.7}
      >
        <ArrowLeftIcon size={24} color="#334d43" weight="bold" />
      </TouchableOpacity>
    </View>
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
        <View className="z-30">
          {leftElement !== undefined ? leftElement : defaultLeftElement}
        </View>

        {/* Center Title (optional) - constrained to not overlap buttons */}
        {title && (
          <Animated.View
            style={[
              headerTitleStyle,
              {
                position: "absolute",
                left: 60, // Leave space for left button
                right: 60, // Leave space for right button
                bottom: 12, // Match paddingBottom
                alignItems: "center",
                justifyContent: "center",
                zIndex: 10,
              },
            ]}
            pointerEvents="none"
          >
            <Text
              className="text-xl text-foreground-heading"
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {title}
            </Text>
          </Animated.View>
        )}

        {/* Right Element - optionally fades in with title, with optional backdrop */}
        {rightElement ? (
          <View className="z-30 items-center justify-center">
            {showButtonBackdrop && (
              <Animated.View
                className="absolute w-11 h-11 rounded-full"
                style={[
                  {
                    backgroundColor: "#f4f1e8",
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.15,
                    shadowRadius: 3,
                  },
                  buttonBackdropStyle,
                ]}
              />
            )}
            {rightElementAlwaysVisible ? (
              <View>{rightElement}</View>
            ) : (
              <Animated.View style={[headerTitleStyle]}>{rightElement}</Animated.View>
            )}
          </View>
        ) : (
          <View className="w-10" /> // Spacer to balance left element if no right element
        )}
      </View>
    </View>
  );
}
