import React, { useEffect, useState, useRef, useCallback } from "react";
import { View, Text, Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BottomSheetModal } from "@gorhom/bottom-sheet";
import Animated, { useAnimatedStyle, withTiming, withDelay, Easing } from "react-native-reanimated";
import { ArrowRightIcon } from "phosphor-react-native";
import { useTranslation } from "react-i18next";

import { SHOWCASE_DATA, ShowcaseItem } from "@components/welcome/ShowcaseItems";
import { CentralDeck } from "@components/welcome/CentralDeck";
import { SatelliteSource } from "@components/welcome/SatelliteSource";
import { AuthMethodSheet } from "@/components/auth";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export default function WelcomeScreen() {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const [mounted, setMounted] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  // Track which variant to show for each category
  const [variantIndices, setVariantIndices] = useState([0, 0, 0, 0]);

  // Auth method bottom sheet ref
  const authMethodSheetRef = useRef<BottomSheetModal>(null);

  const handleStartCollecting = useCallback(() => {
    authMethodSheetRef.current?.present();
  }, []);

  const handleCloseAuthSheet = useCallback(() => {
    authMethodSheetRef.current?.dismiss();
  }, []);

  // Build current showcase items from SHOWCASE_DATA using variant indices
  const currentItems: ShowcaseItem[] = SHOWCASE_DATA.map((categoryItems, categoryIdx) => {
    const variantIdx = variantIndices[categoryIdx] % categoryItems.length;
    return categoryItems[variantIdx];
  });

  useEffect(() => {
    setMounted(true);
    const itemCount = SHOWCASE_DATA.length;
    const interval = setInterval(() => {
      setActiveIndex((prev) => {
        const next = (prev + 1) % itemCount;
        // When cycling to a category, advance its variant for next time
        setVariantIndices((indices) => {
          const newIndices = [...indices];
          newIndices[next] = indices[next] + 1;
          return newIndices;
        });
        return next;
      });
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const headerStyle = useAnimatedStyle(() => ({
    opacity: withTiming(mounted ? 1 : 0, { duration: 1000 }),
    transform: [
      {
        translateY: withTiming(mounted ? 0 : 16, {
          duration: 1000,
          easing: Easing.out(Easing.cubic),
        }),
      },
    ],
  }));

  const graphicStyle = useAnimatedStyle(() => ({
    opacity: withDelay(300, withTiming(mounted ? 1 : 0, { duration: 1000 })),
    transform: [{ scale: withDelay(300, withTiming(mounted ? 1 : 0.95, { duration: 1000 })) }],
  }));

  const ctaStyle = useAnimatedStyle(() => ({
    opacity: withDelay(500, withTiming(mounted ? 1 : 0, { duration: 1000 })),
    transform: [{ translateY: withDelay(500, withTiming(mounted ? 0 : 16, { duration: 1000 })) }],
  }));

  return (
    <View className="flex-1 bg-surface overflow-hidden">
      <View
        className="flex-1 flex-col items-center justify-between px-6"
        style={{ paddingTop: insets.top + 24, paddingBottom: insets.bottom + 32 }}
      >
        {/* HEADER */}
        <Animated.View style={headerStyle} className="items-center space-y-5 mt-4">
          <Text className="font-serif text-5xl leading-[1.05] tracking-tight text-stone-800 text-center">
            {t("welcome.headline")}
            {"\n"}
            <Text className="italic text-[#334d43]">{t("welcome.headlineHighlight")}</Text>
          </Text>
          <Text className="text-stone-500 text-sm font-medium max-w-[280px] text-center leading-relaxed mt-4">
            {t("welcome.subtitle1")}
          </Text>
          <Text className="text-stone-500 text-sm font-medium max-w-[280px] text-center leading-relaxed">
            {t("welcome.subtitle2")}
          </Text>
        </Animated.View>

        <Animated.View
          style={graphicStyle}
          className="relative w-full max-w-[320px] h-[420px] items-center justify-center my-4"
        >
          {/* SATELLITE SOURCES */}
          {currentItems.map((item, idx) => (
            <SatelliteSource
              key={`${item.source.id}-${idx}`}
              item={item}
              isActive={idx === activeIndex}
              index={idx}
            />
          ))}
          {/* CENTRAL DECK */}
          <CentralDeck activeIndex={activeIndex} currentItems={currentItems} />
        </Animated.View>

        {/* CTA */}
        <Animated.View style={ctaStyle} className="w-full items-center space-y-4">
          <AnimatedPressable
            onPress={handleStartCollecting}
            className="group relative w-full h-16 bg-primary rounded-2xl flex-row items-center justify-center gap-3 overflow-hidden active:scale-95 transition-transform"
          >
            <Text className="text-white font-bold text-sm uppercase tracking-[0.2em] z-10">
              {t("welcome.cta")}
            </Text>
            <ArrowRightIcon size={18} color="white" weight="bold" style={{ zIndex: 10 }} />
          </AnimatedPressable>

          <Text className="text-stone-400 text-[10px] font-bold uppercase tracking-widest opacity-60 mt-4">
            {t("welcome.socialProof")}
          </Text>
        </Animated.View>
      </View>

      {/* Auth Method Selection Bottom Sheet */}
      <AuthMethodSheet ref={authMethodSheetRef} onClose={handleCloseAuthSheet} />
    </View>
  );
}
