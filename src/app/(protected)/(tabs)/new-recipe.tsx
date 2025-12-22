import React, { useRef } from "react";
import { View, Text, TouchableOpacity, Image } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import {
  Camera,
  GlobeHemisphereWest,
  Link as LinkIcon,
  Microphone,
  Pencil,
  ArrowRight,
} from "phosphor-react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { BottomSheetModal } from "@gorhom/bottom-sheet";
import { useDeviceType } from "@/hooks/useDeviceType";
import Toast from "react-native-toast-message";
import { useTranslation } from "react-i18next";
import { useExtraction } from "@/contexts/ExtractionContext";
import { CreditsBadge, CreditsBottomSheet } from "@/components/credits";
import * as Haptics from "expo-haptics";

type ExtractionMethod = "image" | "link" | "voice" | "text";

export default function NewRecipeScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { isTablet } = useDeviceType();
  const { canStartNewExtraction } = useExtraction();
  const creditsSheetRef = useRef<BottomSheetModal>(null);

  const handleMethodSelect = (method: ExtractionMethod) => {
    // Check if user can start a new extraction (free users limited to 1 concurrent)
    if (!canStartNewExtraction()) {
      Toast.show({
        type: "info",
        text1: t("extraction.limitReached.title"),
        text2: t("extraction.limitReached.message"),
      });
      return;
    }
    router.push(`/extraction/${method}`);
  };

  const handleCreditsPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    creditsSheetRef.current?.present();
  };

  return (
    <View className="flex-1 bg-surface">
      <Animated.View
        entering={FadeInDown.duration(400)}
        className="flex-1 p-5"
        style={{ paddingTop: insets.top + 24, marginBottom: isTablet ? insets.bottom + 48 : 0 }}
      >
        <View className="mb-8 flex-row items-stretch justify-between">
          <View className="flex-1">
            <Text className="text-[10px] font-bold uppercase tracking-[0.2em] text-foreground-tertiary mb-3">
              {t("extraction.newRecipe.subtitle")}
            </Text>
            <Text
              className="font-playfair-bold text-4xl text-foreground-heading leading-[1.1]"
              allowFontScaling={false}
            >
              {t("extraction.newRecipe.title")}
              {"\n"}
              <Text className="text-primary italic">{t("extraction.newRecipe.titleHighlight")}</Text>
            </Text>
          </View>
          <View className="items-end justify-end">
            <CreditsBadge onPress={handleCreditsPress} />
          </View>
        </View>

        <View className="flex-1 gap-4">
          {/* HERO CARD: Photo/Camera - flex-3 */}
          <View className="flex-[3] rounded-2xl overflow-hidden bg-primary-darker relative">
            <TouchableOpacity
              activeOpacity={0.9}
              onPress={() => handleMethodSelect("image")}
              className="flex-1"
            >
              <View className="absolute inset-0">
                <Image
                  source={require("../../../../assets/images/cookingimage.png")}
                  className="w-full h-full opacity-70"
                />
                <LinearGradient
                  colors={["transparent", "rgba(0,0,0,0.6)"]}
                  style={{ position: "absolute", left: 0, right: 0, top: 0, bottom: 0 }}
                />
              </View>

              <View className="flex-1 justify-end p-6">
                <View className="flex-row justify-between items-end">
                  <View className="flex-1">
                    <BlurView
                      intensity={30}
                      tint="light"
                      className="w-12 h-12 rounded-full items-center justify-center mb-3 border border-white/10 overflow-hidden"
                    >
                      <Camera size={24} color="#fff" weight="duotone" />
                    </BlurView>
                    <Text
                      className="font-playfair-bold text-3xl text-white mb-1"
                      allowFontScaling={false}
                    >
                      {t("extraction.newRecipe.scanDish.title")}
                    </Text>
                    <Text className="text-white/80 text-[10px] font-bold tracking-widest uppercase">
                      {t("extraction.newRecipe.scanDish.subtitle")}
                    </Text>
                  </View>
                  <View className="w-8 h-8 rounded-full border border-white/30 items-center justify-center">
                    <ArrowRight size={16} color="#fff" />
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          </View>

          {/* Import from Web - flex-2 */}
          <View className="flex-[2] bg-[#E8E6E1] rounded-2xl overflow-hidden">
            <TouchableOpacity
              activeOpacity={0.9}
              onPress={() => handleMethodSelect("link")}
              className="flex-1 p-6 justify-between"
            >
              <View className="flex-row justify-between items-start">
                <View className="w-10 h-10 rounded-full bg-stone-900/5 items-center justify-center">
                  <LinkIcon size={20} color="#57534e" weight="duotone" />
                </View>
                <GlobeHemisphereWest
                  size={64}
                  color="#e7e5e4"
                  weight="thin"
                  style={{ position: "absolute", right: -10, top: -10, opacity: 0.5 }}
                />
              </View>
              <View>
                <Text className="font-playfair-bold text-xl text-foreground-heading mb-1">
                  {t("extraction.newRecipe.importWeb.title")}
                </Text>
                <Text
                  className="text-[10px] font-bold tracking-widest text-foreground-muted uppercase"
                  adjustsFontSizeToFit
                  numberOfLines={1}
                >
                  {t("extraction.newRecipe.importWeb.subtitle")}
                </Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* Dictate/Write row - flex-2 */}
          <View className="flex-[2] flex-row gap-4">
            <View className="flex-1 bg-primary rounded-2xl overflow-hidden">
              <TouchableOpacity
                activeOpacity={0.9}
                // onPress={() => handleMethodSelect('voice')}
                onPress={() =>
                  Toast.show({
                    type: "info",
                    text1: t("extraction.newRecipe.dictate.comingSoon"),
                    text2: t("extraction.newRecipe.dictate.notAvailable"),
                  })
                }
                className="flex-1 p-5 justify-between"
              >
                <View className="w-10 h-10 rounded-full bg-white/10 items-center justify-center">
                  <Microphone size={20} color="#fff" weight="duotone" />
                </View>
                <View>
                  <Text className="font-playfair-bold text-lg text-white mb-0.5">
                    {t("extraction.newRecipe.dictate.title")}
                  </Text>
                  <Text
                    className="text-white/60 text-[10px] font-bold tracking-widest uppercase"
                    adjustsFontSizeToFit
                    numberOfLines={1}
                  >
                    {t("extraction.newRecipe.dictate.subtitle")}
                  </Text>
                </View>
              </TouchableOpacity>
            </View>

            <View className="flex-1 bg-white border border-border-light rounded-2xl overflow-hidden">
              <TouchableOpacity
                activeOpacity={0.9}
                onPress={() => handleMethodSelect("text")}
                className="flex-1 p-5 justify-between"
              >
                <View className="w-10 h-10 rounded-full bg-stone-50 items-center justify-center">
                  <Pencil size={20} color="#3a3226" weight="duotone" />
                </View>
                <View>
                  <Text className="font-playfair-bold text-lg text-foreground-heading mb-0.5">
                    {t("extraction.newRecipe.write.title")}
                  </Text>
                  <Text
                    className="text-foreground-tertiary text-[10px] font-bold tracking-widest uppercase"
                    adjustsFontSizeToFit
                    numberOfLines={1}
                  >
                    {t("extraction.newRecipe.write.subtitle")}
                  </Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Animated.View>

      <CreditsBottomSheet ref={creditsSheetRef} />
    </View>
  );
}
