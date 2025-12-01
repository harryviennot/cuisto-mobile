import { useEffect } from "react";
import { View, Text, Pressable, StatusBar } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { ArrowRight } from "phosphor-react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  Easing,
} from "react-native-reanimated";
import { FloatingSourceCard, HeroPhone } from "@/components/welcome";
import { BlurView } from "expo-blur";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export default function WelcomeScreen() {
  const insets = useSafeAreaInsets();

  // Mount animations
  const headerOpacity = useSharedValue(0);
  const headerTranslateY = useSharedValue(16);
  const ctaOpacity = useSharedValue(0);
  const ctaTranslateY = useSharedValue(16);

  // Button press animation
  const buttonScale = useSharedValue(1);

  useEffect(() => {
    // Header animation
    headerOpacity.value = withTiming(1, { duration: 700 });
    headerTranslateY.value = withTiming(0, {
      duration: 700,
      easing: Easing.out(Easing.cubic),
    });

    // CTA animation (delayed)
    setTimeout(() => {
      ctaOpacity.value = withTiming(1, { duration: 700 });
      ctaTranslateY.value = withTiming(0, {
        duration: 700,
        easing: Easing.out(Easing.cubic),
      });
    }, 500);
  }, [headerOpacity, headerTranslateY, ctaOpacity, ctaTranslateY]);

  const headerAnimatedStyle = useAnimatedStyle(() => ({
    opacity: headerOpacity.value,
    transform: [{ translateY: headerTranslateY.value }],
  }));

  const ctaAnimatedStyle = useAnimatedStyle(() => ({
    opacity: ctaOpacity.value,
    transform: [{ translateY: ctaTranslateY.value }],
  }));

  const buttonAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: buttonScale.value }],
  }));

  const handlePressIn = () => {
    buttonScale.value = withSpring(0.97, { damping: 15, stiffness: 400 });
  };

  const handlePressOut = () => {
    buttonScale.value = withSpring(1, { damping: 15, stiffness: 400 });
  };

  const handleGetStarted = () => {
    router.push("/auth");
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#0c0a09" }}>
      <StatusBar barStyle="light-content" />

      {/* Background Ambience */}
      <View
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
        }}
        pointerEvents="none"
      >
        {/* Top left emerald orb */}
        <View
          style={{
            position: "absolute",
            top: "-10%",
            left: "-20%",
            width: 300,
            height: 300,
            borderRadius: 150,
            backgroundColor: "rgba(6, 78, 59, 0.4)", // emerald-900/30
            // Note: blur is simulated via large border radius and low opacity
            // For true blur, would need BlurView or SVG filter
          }}
        />
        {/* Bottom right stone orb */}
        <View
          style={{
            position: "absolute",
            bottom: "10%",
            right: "-20%",
            width: 300,
            height: 300,
            borderRadius: 150,
            backgroundColor: "rgba(41, 37, 36, 0.7)", // stone-800/40
          }}
        />
      </View>

      <BlurView
        style={{
          flex: 1,
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "rgba(0, 0, 0, 0.5)",
        }}
        tint="dark"
        intensity={65}
      />

      {/* Main Content */}
      <View
        style={{
          flex: 1,
          paddingHorizontal: 24,
          paddingTop: insets.top + 48,
          paddingBottom: insets.bottom + 48,
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        {/* HEADER */}
        <Animated.View
          style={[headerAnimatedStyle, { alignItems: "center", gap: 16 }]}
        >
          {/* Brand badge */}
          {/* <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 8,
              paddingHorizontal: 12,
              paddingVertical: 6,
              borderRadius: 9999,
              backgroundColor: "rgba(255, 255, 255, 0.05)",
              borderWidth: 1,
              borderColor: "rgba(255, 255, 255, 0.1)",
            }}
          > */}
          {/* <View
              style={{
                width: 6,
                height: 6,
                borderRadius: 3,
                backgroundColor: "#34d399", // emerald-400
              }}
            />
            <Text
              style={{
                fontSize: 10,
                fontWeight: "700",
                letterSpacing: 2,
                textTransform: "uppercase",
                color: "#34d399", // emerald-400
              }}
            >
              Cuisto
            </Text>
          </View> */}

          {/* Tagline */}
          <Text
            style={{
              fontFamily: "PlayfairDisplay_400Regular",
              fontSize: 48,
              lineHeight: 52,
              textAlign: "center",
              color: "#ffffff",
              letterSpacing: -0.5,
            }}
          >
            All your recipes.{"\n"}
            <Text
              style={{
                fontFamily: "PlayfairDisplay_400Regular_Italic",
                color: "rgba(255, 255, 255, 0.4)",
              }}
            >
              One Place.
            </Text>
          </Text>
        </Animated.View>

        {/* GRAPHIC AREA */}
        <View
          style={{
            position: "relative",
            width: "100%",
            maxWidth: 320,
            height: 420,
            alignItems: "center",
            justifyContent: "center",
            marginVertical: 16,
          }}
        >
          {/* Central Phone */}
          <HeroPhone delay={300} />

          {/* Floating Cards */}
          {/* Top Left - TikTok */}
          <View
            style={{
              position: "absolute",
              top: 32,
              left: -8,
              zIndex: 30,
            }}
          >
            <FloatingSourceCard
              type="tiktok"
              label="Feta Pasta"
              rotation={-6}
              delay={0}
            />
          </View>

          {/* Top Right - Instagram */}
          <View
            style={{
              position: "absolute",
              top: 64,
              right: -8,
              zIndex: 30,
            }}
          >
            <FloatingSourceCard
              type="instagram"
              label="@chef_mike"
              rotation={3}
              delay={1000}
            />
          </View>

          {/* Bottom Left - Web */}
          <View
            style={{
              position: "absolute",
              bottom: 64,
              left: -16,
              zIndex: 30,
            }}
          >
            <FloatingSourceCard
              type="web"
              label="NYT Cooking"
              rotation={6}
              delay={2000}
            />
          </View>

          {/* Bottom Right - Voice */}
          <View
            style={{
              position: "absolute",
              bottom: 32,
              right: -16,
              zIndex: 30,
            }}
          >
            <FloatingSourceCard
              type="voice"
              label="Grandma's Pie"
              rotation={-3}
              delay={500}
            />
          </View>
        </View>

        {/* CTA */}
        <Animated.View style={[ctaAnimatedStyle, { width: "100%" }]}>
          <AnimatedPressable
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            onPress={handleGetStarted}
            style={[
              buttonAnimatedStyle,
              {
                width: "100%",
                height: 64,
                borderRadius: 16,
                backgroundColor: "#ffffff",
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                gap: 12,
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 8,
                elevation: 8,
              },
            ]}
          >
            <Text
              style={{
                fontSize: 14,
                fontWeight: "700",
                letterSpacing: 3,
                textTransform: "uppercase",
                color: "#0c0a09", // stone-950
              }}
            >
              Start Collecting
            </Text>
            <ArrowRight size={18} color="#0c0a09" weight="bold" />
          </AnimatedPressable>
        </Animated.View>
      </View>
    </View>
  );
}
