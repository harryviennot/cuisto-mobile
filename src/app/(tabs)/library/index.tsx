/**
 * Library Screen
 *
 * Displays user collections (All Recipes, Favorites) with a premium, editorial design.
 * System collections are hardcoded for instant rendering, with counts fetched async.
 */
import React, { useState, useMemo } from "react";
import { View, ScrollView, RefreshControl, TouchableOpacity, Text } from "react-native";
import { useTranslation } from "react-i18next";
import { router, Stack } from "expo-router";

import { useCollectionCounts } from "@/hooks/useCollections";
import { LibraryHeader } from "@/components/library/LibraryHeader";

import { BookmarkIcon, SquaresFourIcon } from "phosphor-react-native";

// Get font size and position based on digit count for the background number
const getCountStyle = (count: number = 0) => {
  if (count > 999) return { fontSize: 65, top: 4 };
  if (count > 99) return { fontSize: 100, top: -12 };
  return { fontSize: 120, top: -16 };
};

export default function LibraryScreen() {
  const { t } = useTranslation();
  const [refreshing, setRefreshing] = useState(false);

  // Fetch only the recipe counts (lightweight)
  const { data: counts, refetch } = useCollectionCounts();

  // Handle pull-to-refresh
  const handleRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };


  return (
    <View className="flex-1 bg-surface">

      <Stack.Screen options={{ header: () => <LibraryHeader /> }} />
      <ScrollView
        className="flex-1"
        contentContainerStyle={{
          paddingTop: 16,
          paddingHorizontal: 20,
          paddingBottom: 120, // space for tab bar
        }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor="#334d43"
            progressViewOffset={16}
          />
        }
      >

        {/* Smart Collections Grid - Always rendered immediately */}

        <View className="flex-row gap-4 ">
          <View className="relative flex-1 max-h-48 bg-primary rounded-2xl overflow-hidden aspect-[4/3]">
            <Text className="absolute -right-4 font-playfair font-bold leading-none text-surface-texture-light opacity-10"
              style={getCountStyle(counts?.extracted)}
            >
              {counts?.extracted || 0}
            </Text>
            <TouchableOpacity
              activeOpacity={0.9}
              onPress={() => router.push("/library/collection/extracted")}

              className="flex-1 p-5 justify-between"
            >
              <View className="w-10 h-10 rounded-full bg-white/10 items-center justify-center">
                <SquaresFourIcon size={20} color="#fff" weight="duotone" />
              </View>
              <View>
                <Text className="font-playfair-bold text-lg text-white mb-0.5">
                  {t("library.collections.allRecipes")}
                </Text>
                <Text className="text-white/60 text-[10px] font-bold tracking-widest uppercase">
                  {t("library.collections.allRecipesSubtitle")}
                </Text>
              </View>
            </TouchableOpacity>
          </View>

          <View className="relative flex-1 max-h-48 bg-white border border-border-light rounded-2xl overflow-hidden">
            <Text className="absolute -right-4 font-playfair font-bold leading-none text-surface-texture-dark opacity-10"
              style={getCountStyle(counts?.saved)}
            >
              {counts?.saved || 0}
            </Text>
            <TouchableOpacity
              activeOpacity={0.9}
              onPress={() => router.push("/library/collection/saved")}
              className="flex-1 p-5 justify-between"
            >
              <View className="w-10 h-10 rounded-full bg-stone-50 items-center justify-center">
                <BookmarkIcon size={20} color="#3a3226" weight="duotone" />
              </View>
              <View>
                <Text className="font-playfair-bold text-lg text-foreground-heading mb-0.5">
                  {t("library.collections.favorites")}
                </Text>
                <Text className="text-foreground-tertiary text-[10px] font-bold tracking-widest uppercase">
                  {t("library.collections.favoritesSubtitle")}
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>

      </ScrollView>
    </View>
  );
}
