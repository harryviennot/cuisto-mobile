/**
 * Library Screen
 *
 * Displays user collections (All Recipes, Favorites) with a premium, editorial design.
 * System collections are hardcoded for instant rendering, with counts fetched async.
 */
import React, { useState } from "react";
import { View, ScrollView, RefreshControl } from "react-native";
import { router, Stack } from "expo-router";

import { useCollectionCounts } from "@/hooks/useCollections";
import { LibraryHeader, SmartCollectionCard } from "@/components/library";

export default function LibraryScreen() {
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
        {/* Smart Collections Grid */}
        <View className="flex-row gap-4">
          <SmartCollectionCard
            slug="extracted"
            count={counts?.extracted}
            variant="primary"
            onPress={() => router.push("/library/collection/extracted")}
          />
          <SmartCollectionCard
            slug="saved"
            count={counts?.saved}
            variant="secondary"
            onPress={() => router.push("/library/collection/saved")}
          />
        </View>
      </ScrollView>
    </View>
  );
}
