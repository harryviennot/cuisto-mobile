import React from "react";
import { View, Text } from "react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import Animated, { useAnimatedStyle, withTiming } from "react-native-reanimated";
import { ClockIcon, FlameIcon } from "phosphor-react-native";
import { useTranslation } from "react-i18next";

import { ShowcaseItem } from "./ShowcaseItems";

interface CentralDeckProps {
  activeIndex: number;
  currentItems: ShowcaseItem[];
}

// Extracted component to properly use hooks
const AnimatedImageItem = ({
  item,
  isActive,
}: {
  item: ShowcaseItem;
  isActive: boolean;
}) => {
  const animatedStyle = useAnimatedStyle(() => ({
    opacity: withTiming(isActive ? 1 : 0, { duration: 700 }),
    transform: [{ scale: withTiming(isActive ? 1 : 1.1, { duration: 700 }) }],
  }));

  return (
    <Animated.View
      key={item.source.id}
      style={[animatedStyle, { position: "absolute", inset: 0 }]}
    >
      <Image
        source={item.recipe.image}
        style={{ width: "100%", height: "100%" }}
        contentFit="cover"
      />
    </Animated.View>
  );
};

// Extracted component for animated title/subtitle
const AnimatedTitleItem = ({
  item,
  isActive,
}: {
  item: ShowcaseItem;
  isActive: boolean;
}) => {
  const textStyle = useAnimatedStyle(() => ({
    opacity: withTiming(isActive ? 1 : 0, { duration: 500 }),
    transform: [{ translateY: withTiming(isActive ? 0 : 16, { duration: 500 }) }],
  }));

  return (
    <Animated.View key={item.source.id} style={[textStyle, { position: "absolute", inset: 0 }]}>
      <Text className="text-2xl font-serif text-white leading-none mb-1">
        {item.recipe.title}
      </Text>
      <Text className="text-white/70 text-xs font-medium">{item.recipe.subtitle}</Text>
    </Animated.View>
  );
};

// Extracted component for animated time display
const AnimatedTimeItem = ({
  item,
  isActive,
  label,
}: {
  item: ShowcaseItem;
  isActive: boolean;
  label: string;
}) => {
  const style = useAnimatedStyle(() => ({
    opacity: withTiming(isActive ? 1 : 0, { duration: 400 }),
    transform: [{ translateY: withTiming(isActive ? 0 : 8, { duration: 400 }) }],
  }));

  return (
    <Animated.View key={item.source.id} style={[style, { position: "absolute", left: 0 }]}>
      <Text className="text-sm font-medium text-stone-500" numberOfLines={1}>
        {item.recipe.time} {label}
      </Text>
    </Animated.View>
  );
};

// Extracted component for animated calories display
const AnimatedCaloriesItem = ({
  item,
  isActive,
  label,
}: {
  item: ShowcaseItem;
  isActive: boolean;
  label: string;
}) => {
  const style = useAnimatedStyle(() => ({
    opacity: withTiming(isActive ? 1 : 0, { duration: 400 }),
    transform: [{ translateY: withTiming(isActive ? 0 : 8, { duration: 400 }) }],
  }));

  return (
    <Animated.View key={item.source.id} style={[style, { position: "absolute", left: 0 }]}>
      <Text className="text-sm font-medium text-stone-500" numberOfLines={1}>
        {item.recipe.calories} {label}
      </Text>
    </Animated.View>
  );
};

export const CentralDeck = ({ activeIndex, currentItems }: CentralDeckProps) => {
  const { t } = useTranslation();

  return (
    <View className="relative z-20 w-[248px]" style={{ aspectRatio: 3 / 4 }}>
      {/* Main Card */}
      <View
        className="absolute inset-0 bg-white rounded-2xl flex-col"
        style={{
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 20 },
          shadowOpacity: 0.2,
          shadowRadius: 50,
          elevation: 12,
        }}
      >
        {/* Dynamic Image */}
        <View className="h-[80%] relative bg-stone-100 overflow-hidden rounded-t-2xl">
          {currentItems.map((item, idx) => (
            <AnimatedImageItem key={item.source.id} item={item} isActive={idx === activeIndex} />
          ))}

          <View className="absolute w-full h-full justify-end overflow-hidden">
            <LinearGradient
              colors={["transparent", "rgba(0,0,0,0.8)"]}
              style={{
                height: "60%",
                justifyContent: "flex-end",
                paddingHorizontal: 12,
                paddingBottom: 8,
              }}
            >
              <View className="flex-row gap-2 mb-2">
                <View className="px-2 py-1 rounded-md bg-white/20 border border-white/10">
                  <Text className="text-[10px] font-bold uppercase tracking-wide text-white">
                    {t("welcome.imported")}
                  </Text>
                </View>
              </View>

              {/* Animated Title/Subtitle */}
              <View className="h-12 relative">
                {currentItems.map((item, idx) => (
                  <AnimatedTitleItem
                    key={item.source.id}
                    item={item}
                    isActive={idx === activeIndex}
                  />
                ))}
              </View>
            </LinearGradient>
          </View>
        </View>

        {/* Bottom Action Bar - Animated time/calories */}
        <View className="flex-1 bg-white px-4 flex-row items-center justify-between rounded-b-2xl">
          <View className="flex-row items-center gap-1">
            <ClockIcon size={16} color="#a8a29e" weight="duotone" />
            <View className="h-5 relative" style={{ width: 54 }}>
              {currentItems.map((item, idx) => (
                <AnimatedTimeItem
                  key={item.source.id}
                  item={item}
                  isActive={idx === activeIndex}
                  label={t("common.min")}
                />
              ))}
            </View>
          </View>
          <View className="flex-row items-center gap-1">
            <FlameIcon size={16} color="#a8a29e" weight="duotone" />
            <View className="h-5 relative" style={{ width: 60 }}>
              {currentItems.map((item, idx) => (
                <AnimatedCaloriesItem
                  key={item.source.id}
                  item={item}
                  isActive={idx === activeIndex}
                  label={t("common.kcal")}
                />
              ))}
            </View>
          </View>
        </View>
      </View>
    </View>
  );
};
