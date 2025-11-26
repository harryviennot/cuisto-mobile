import React, { useMemo } from "react";
import { View, Text, SectionList } from "react-native";
import { Stack, CheckCircle } from "phosphor-react-native";
import { useTranslation } from "react-i18next";
import { BlurView } from "expo-blur";
import Animated from "react-native-reanimated";
import type { Ingredient } from "@/types/recipe";

interface DrawerContentProps {
  viewAllIngredients: boolean;
  hasRelevantIngredients: boolean;
  visibleIngredients: Record<string, (Ingredient & { isRelevant: boolean })[]>;
  controlsHeight: number;
}

const AnimatedSectionList = Animated.createAnimatedComponent(SectionList);

export const DrawerContent: React.FC<DrawerContentProps> = ({
  viewAllIngredients,
  hasRelevantIngredients,
  visibleIngredients,
  controlsHeight
}) => {
  const { t } = useTranslation();

  // Transform visibleIngredients object into sections array for SectionList
  const sections = useMemo(() => {
    if (!visibleIngredients) return [];
    return Object.entries(visibleIngredients).map(([title, data]) => ({
      title,
      data: data || [],
    })).filter(section => section.data.length > 0);
  }, [visibleIngredients]);

  if (!viewAllIngredients && !hasRelevantIngredients) {
    // Empty state - not scrollable, centered
    return (
      <View className="flex-1 items-center justify-center px-6">
        <View
          className="mb-4 h-12 w-12 items-center justify-center rounded-full"
          style={{ backgroundColor: "rgba(255, 255, 255, 0.05)" }}
        >
          <Stack size={20} color="#78716c" />
        </View>
        <Text className="text-center text-sm font-medium text-stone-400">
          {t("recipe.cookingMode.noIngredientsForStep")}
        </Text>
      </View>
    );
  }

  // SectionList for sticky headers
  return (
    <AnimatedSectionList
      sections={sections}
      keyExtractor={(item: any, index: number) => item.name + index}
      style={{
        flex: 1,
        zIndex: 1,
        marginTop: 0, // Overlap with tabs section
      }}
      contentContainerStyle={{
        paddingBottom: 16,
        paddingHorizontal: 24,
      }}
      showsVerticalScrollIndicator={false}
      stickySectionHeadersEnabled={true}
      renderSectionHeader={({ section }: { section: any }) => {
        // if (section.title === "Main") return null;
        return (
          <BlurView
            intensity={40}
            tint="dark"
            style={{
              marginHorizontal: -24,
              paddingHorizontal: 24,
              paddingVertical: 12,
              overflow: 'hidden',
            }}
          >
            <View
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: "rgba(28, 25, 23, 0.7)", // stone-900 with opacity
              }}
            />
            <Text
              className="text-[10px] font-bold uppercase text-emerald-500"
              style={{
                letterSpacing: 3.2
              }}
            >
              {section.title}
            </Text>
            {/* <View
              style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                height: 1,
                backgroundColor: "rgba(255, 255, 255, 0.05)"
              }}
            /> */}
          </BlurView>
        );
      }}
      renderItem={({ item: ing, index }: { item: any; index: number }) => (
        <View
          className="flex-row items-start gap-4 rounded-xl border p-3 mb-2"
          style={{
            backgroundColor: "rgba(255, 255, 255, 0.05)",
            borderColor: "transparent",
            marginTop: index === 0 ? 12 : 0,
          }}
        >
          <View className="mt-0.5">
            {ing.isRelevant ? (
              <CheckCircle
                size={18}
                color="#34d399"
                weight="fill"
              />
            ) : (
              <View
                style={{
                  width: 18,
                  height: 18,
                  borderRadius: 9,
                  borderWidth: 2,
                  borderColor: "#57534e"
                }}
              />
            )}
          </View>
          <View className="flex-1">
            <View className="flex-row items-baseline justify-between gap-4">
              <Text
                className="flex-1 font-medium leading-snug"
                style={{
                  color: ing.isRelevant ? "#f5f5f4" : "#a8a29e",
                }}
              >
                {ing.name}
              </Text>
              <Text
                className="text-sm font-bold"
                style={{
                  color: ing.isRelevant ? "#6ee7b7" : "#57534e",
                  fontVariant: ["tabular-nums"]
                }}
              >
                {ing.quantity} {ing.unit}
              </Text>
            </View>
          </View>
        </View>
      )}
    />
  );
};
