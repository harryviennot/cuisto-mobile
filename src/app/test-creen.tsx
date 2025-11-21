/**
 * Test Screen - Sticky Header Demo
 * Demonstrates sticky search bar that hides on scroll down using stickyHeaderIndices
 */
import React from "react";
import { View, Text, TouchableOpacity, FlatList, RefreshControl } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { SearchButton } from "@/components/home/SearchButton";
import { useTranslation } from "react-i18next";
import { BlurView } from "expo-blur";

// Constants
const COLORS = {
  primary: "#4A6572",
  primaryDark: "#344955",
  white: "#FFFFFF",
  gray: "#BBBBBB",
  lightGray: "#F5F5F5",
  black: "#000000",
  border: "#E5E5E5",
};

// Types
type SearchItem = {
  id: string;
  type: "search";
};

type RecipeItem = {
  id: string;
  title: string;
  description: string;
  tags: string[];
  type: "recipe";
};

type ListItem = SearchItem | RecipeItem;

export default function TestScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const [refreshing, setRefreshing] = React.useState(false);

  // Mock refresh handler
  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
    }, 2000);
  }, []);

  // Generate mock content - add search bar as first item
  const mockItems: ListItem[] = Array.from({ length: 30 }, (_, i) => ({
    id: i.toString(),
    title: `Recipe ${i + 1}`,
    description: `Delicious recipe number ${i + 1}`,
    tags: ["Quick", "Easy", "Healthy"],
    type: "recipe" as const,
  }));

  return (
    <View className="flex-1 bg-surface">
      <FlatList
        data={mockItems}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{
          // paddingTop: insets.top, // Push content down so it starts below safe area
          paddingBottom: 100,
        }}
        ListHeaderComponent={
          <BlurView
            intensity={50}
            tint="light"
            style={{
              paddingTop: insets.top,
              paddingHorizontal: 16,
              marginBottom: 16,
            }}
          >
            <Text className="text-5xl font-playfair-bold leading-tight text-foreground-heading">
              Let&apos;s Cook!
            </Text>
            <SearchButton onPress={() => {}} placeholder={t("common.search")} />
          </BlurView>
        }
        stickyHeaderHiddenOnScroll
        stickyHeaderIndices={[0]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#334d43"
            colors={["#334d43"]}
            progressViewOffset={insets.top} // Position refresh control below safe area
          />
        }
        renderItem={({ item }) => {
          // Type guard to ensure item is a RecipeItem
          if (item.type !== "recipe") {
            return null;
          }

          // Render recipe item
          return (
            <TouchableOpacity
              activeOpacity={0.8}
              style={{
                backgroundColor: COLORS.white,
                padding: 16,
                borderRadius: 12,
                marginHorizontal: 16,
                marginBottom: 16,
                shadowColor: COLORS.black,
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 4,
                elevation: 2,
              }}
              onPress={() => console.log("Item pressed:", item.id)}
            >
              <Text
                style={{
                  fontSize: 16,
                  fontWeight: "600",
                  marginBottom: 5,
                  color: COLORS.black,
                }}
              >
                {item.title}
              </Text>
              <Text style={{ fontSize: 14, color: COLORS.gray, marginBottom: 8 }}>
                {item.description}
              </Text>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
                {item.tags.map((tag: string, index: number) => (
                  <View
                    key={index}
                    style={{
                      backgroundColor: COLORS.lightGray,
                      paddingHorizontal: 8,
                      paddingVertical: 4,
                      borderRadius: 6,
                    }}
                  >
                    <Text style={{ fontSize: 12, color: COLORS.primary }}>{tag}</Text>
                  </View>
                ))}
              </View>
            </TouchableOpacity>
          );
        }}
      />

      {/* Always-visible BlurView for safe area - stays on top even when header hides */}
      <BlurView
        intensity={50}
        tint="light"
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: insets.top,
        }}
        pointerEvents="none" // Allow touches to pass through to content below
      />
    </View>
  );
}
