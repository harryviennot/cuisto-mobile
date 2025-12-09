import { View, Text, Pressable, ActivityIndicator, Animated, Keyboard } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useCallback, useEffect, useRef, useState } from "react";
import { MagnifyingGlass, X } from "phosphor-react-native";
import { router } from "expo-router";
import { useTranslation } from "react-i18next";
import { SearchBar } from "@/components/home/SearchBar";
import { MasonryGrid } from "@/components/home/MasonryGrid";
import { useSearch } from "@/hooks/useSearch";
import { useSearchContext } from "@/contexts/SearchContext";

export default function SearchScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const {
    searchQuery: contextQuery,
    setSearchQuery: setContextQuery,
    clearSearch: clearContextSearch,
  } = useSearchContext();
  const [localQuery, setLocalQuery] = useState(contextQuery);
  const { isSearching, searchResults, hasSearched, error, search, clearSearch } = useSearch();

  // Background overlay opacity for modal effect
  const backgroundOpacity = useRef(new Animated.Value(0)).current;

  // Animate background overlay on mount
  useEffect(() => {
    Animated.timing(backgroundOpacity, {
      toValue: 1,
      duration: 200,
      useNativeDriver: true,
    }).start();
  }, [backgroundOpacity]);

  // Auto-search when query changes from context (e.g., when navigating from home)
  useEffect(() => {
    if (contextQuery && contextQuery !== localQuery) {
      setLocalQuery(contextQuery);
      search(contextQuery);
    }
  }, [contextQuery, localQuery, search]);

  const handleClose = useCallback(() => {
    // Animate out before closing
    Animated.timing(backgroundOpacity, {
      toValue: 0,
      duration: 150,
      useNativeDriver: true,
    }).start(() => {
      clearSearch();
      clearContextSearch();
      router.back();
    });
  }, [clearSearch, clearContextSearch, backgroundOpacity]);

  const handleSearch = useCallback(
    (query: string) => {
      search(query);
      setContextQuery(query);
    },
    [search, setContextQuery]
  );

  const handleRefresh = useCallback(async () => {
    if (localQuery.trim().length > 0) {
      await search(localQuery);
    }
  }, [localQuery, search]);

  // Handle scroll events for keyboard dismiss
  const handleScroll = useCallback(() => {
    // Dismiss keyboard when scrolling
    Keyboard.dismiss();
  }, []);

  // Empty state component
  const EmptyComponent = (
    <View className="flex-1 items-center justify-center p-6 gap-4" style={{ minHeight: 400 }}>
      {hasSearched && localQuery.trim().length > 0 ? (
        <>
          <MagnifyingGlass size={64} color="#8b7a66" weight="duotone" />
          <Text className="text-xl font-playfair-bold text-foreground-heading text-center">
            No recipes found
          </Text>
          <Text className="text-foreground-secondary text-center">Try a different search term</Text>
        </>
      ) : (
        <>
          <MagnifyingGlass size={64} color="#8b7a66" weight="duotone" />
          <Text className="text-xl font-playfair-bold text-foreground-heading text-center">
            Search for recipes
          </Text>
          <Text className="text-foreground-secondary text-center">
            Enter keywords to find your favorite recipes
          </Text>
        </>
      )}
    </View>
  );

  return (
    <Animated.View
      className="flex-1 bg-surface"
      style={{
        paddingTop: insets.top,
        opacity: backgroundOpacity,
      }}
    >
      {/* Static Header with Search Bar and Close Button */}
      <View
        className="bg-surface border-b border-border"
        style={{
          paddingHorizontal: 16,
          paddingVertical: 12,
        }}
      >
        <View className="flex-row items-center gap-3">
          {/* Search Bar - takes most space */}
          <View className="flex-1">
            <SearchBar
              value={localQuery}
              onChangeText={setLocalQuery}
              onSearch={handleSearch}
              placeholder={t("search.placeholder", "Search recipes...")}
              autoFocus
            />
          </View>

          {/* Close Button (X) */}
          <Pressable
            onPress={handleClose}
            className="p-2 rounded-full active:bg-surface-elevated"
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <X size={24} color="#334d43" weight="bold" />
          </Pressable>
        </View>
      </View>

      {/* Search Results */}
      {isSearching && !hasSearched ? (
        // Show loading during first search
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#334d43" />
          <Text className="mt-4 text-foreground-secondary">Searching recipes...</Text>
        </View>
      ) : error ? (
        // Show error state
        <View className="flex-1 items-center justify-center p-6 gap-4">
          <Text className="text-xl font-playfair-bold text-foreground-heading text-center">
            Something went wrong
          </Text>
          <Text className="text-foreground-secondary text-center">
            {error.message || "Failed to search recipes"}
          </Text>
          <Pressable
            onPress={() => search(localQuery)}
            className="bg-primary rounded-lg px-6 py-3 active:opacity-80"
          >
            <Text className="text-white font-semibold">Try Again</Text>
          </Pressable>
        </View>
      ) : (
        <MasonryGrid
          recipes={searchResults}
          refreshing={false}
          onRefresh={handleRefresh}
          onScroll={handleScroll}
          ListEmptyComponent={EmptyComponent}
        />
      )}
    </Animated.View>
  );
}
