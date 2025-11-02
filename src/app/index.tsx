import { useTranslation } from "react-i18next";
import { View, Text, ActivityIndicator, Pressable, Animated } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRef, useCallback, useState } from "react";
import { Camera, Image as ImageIcon, Plus, Warning } from "phosphor-react-native";
import { useQueryClient } from "@tanstack/react-query";
import { router } from "expo-router";
import { FAB } from "@/components/extraction/FAB";
import {
  ExtractionMethodBottomSheet,
  type ExtractionMethodBottomSheetRef,
} from "@/components/extraction/ExtractionMethodBottomSheet";
import { ImageConfirmationView } from "@/components/extraction/confirmation/ImageConfirmationView";
import { useImageExtractionFlow } from "@/hooks/useImageExtractionFlow";
import {
  IMAGE_EXTRACTION_METHODS,
  IMAGE_EXTRACTION_CONFIG,
  type ExtractionSourceType,
} from "@/config/extractionMethods";
import { SearchButton } from "@/components/recipe/SearchButton";
import { MasonryGrid } from "@/components/recipe/MasonryGrid";
import { useRecipes } from "@/hooks/useRecipes";

export default function Index() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const bottomSheetRef = useRef<ExtractionMethodBottomSheetRef>(null);

  // Scroll position tracking for header show/hide
  const scrollY = useRef(0);
  const lastScrollY = useRef(0);
  const headerTranslateY = useRef(new Animated.Value(0)).current;
  const [isHeaderVisible, setIsHeaderVisible] = useState(true);

  // Use recipes hook for all recipes view
  const {
    data,
    isLoading,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch,
    isRefetching,
  } = useRecipes();

  // Use the image extraction flow hook
  const { handleSelectMethod, handleConfirm, handleAddMore } = useImageExtractionFlow(
    IMAGE_EXTRACTION_CONFIG.maxItems
  );

  // Handle pull-to-refresh
  const handleRefresh = useCallback(async () => {
    queryClient.setQueryData(["recipes"], (oldData: any) => {
      if (!oldData) return oldData;
      return {
        pages: oldData.pages.slice(0, 1),
        pageParams: oldData.pageParams.slice(0, 1),
      };
    });
    await refetch();
  }, [refetch, queryClient]);

  const handleFABPress = () => {
    if (bottomSheetRef.current) {
      try {
        bottomSheetRef.current.present();
      } catch (error) {
        console.error("Error calling present():", error);
      }
    } else {
      console.error("bottomSheetRef.current is null!");
    }
  };

  const handleMethodSelect = async (method: ExtractionSourceType) => {
    const images = await handleSelectMethod(method);
    if (images && images.length > 0) {
      bottomSheetRef.current?.showConfirmation(images);
    }
  };

  const handleConfirmImages = async (images: any[]) => {
    await handleConfirm(images);
    bottomSheetRef.current?.dismiss();
  };

  const methodsWithIcons = IMAGE_EXTRACTION_METHODS.map((method) => ({
    ...method,
    label:
      method.id === "camera"
        ? t("extraction.methods.takePhotos")
        : t("extraction.methods.chooseGallery"),
    icon:
      method.id === "camera" ? (
        <Camera size={32} color="#334d43" weight="duotone" />
      ) : (
        <ImageIcon size={32} color="#334d43" weight="duotone" />
      ),
  }));

  // All recipes
  const allRecipes = data?.pages.flatMap((page) => page) ?? [];

  // Handle infinite scroll
  const handleEndReached = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  // Handle scroll events for header animation
  const handleScroll = useCallback(
    (event: any) => {
      const currentScrollY = event.nativeEvent.contentOffset.y;
      const delta = currentScrollY - lastScrollY.current;

      // Show/hide header based on scroll direction
      const SCROLL_THRESHOLD = 10;
      const HEADER_HEIGHT = 60;

      if (delta > SCROLL_THRESHOLD && currentScrollY > HEADER_HEIGHT) {
        // Scrolling down - hide header
        if (isHeaderVisible) {
          Animated.timing(headerTranslateY, {
            toValue: -HEADER_HEIGHT,
            duration: 200,
            useNativeDriver: true,
          }).start();
          setIsHeaderVisible(false);
        }
      } else if (delta < -SCROLL_THRESHOLD) {
        // Scrolling up - show header
        if (!isHeaderVisible) {
          Animated.timing(headerTranslateY, {
            toValue: 0,
            duration: 200,
            useNativeDriver: true,
          }).start();
          setIsHeaderVisible(true);
        }
      }

      lastScrollY.current = currentScrollY;
      scrollY.current = currentScrollY;
    },
    [isHeaderVisible, headerTranslateY]
  );

  // Navigate to search overlay
  const handleSearchPress = useCallback(() => {
    router.push("/search");
  }, []);

  const handleRetry = useCallback(async () => {
    queryClient.setQueryData(["recipes"], (oldData: any) => {
      if (!oldData) return oldData;
      return {
        pages: oldData.pages.slice(0, 1),
        pageParams: oldData.pageParams.slice(0, 1),
      };
    });
    await refetch();
  }, [refetch, queryClient]);

  // Loading state (initial load)
  if (isLoading) {
    return (
      <View
        className="flex-1 items-center justify-center bg-surface"
        style={{ paddingTop: insets.top }}
      >
        <ActivityIndicator size="large" color="#334d43" />
        <Text className="mt-4 text-foreground-secondary">Loading recipes...</Text>
      </View>
    );
  }

  // Error state
  if (error) {
    return (
      <View
        className="flex-1 items-center justify-center bg-surface p-6 gap-4"
        style={{ paddingTop: insets.top }}
      >
        <Warning size={64} color="#ef4444" weight="duotone" />
        <Text className="text-xl font-playfair-bold text-foreground-heading text-center">
          Oops! Something went wrong
        </Text>
        <Text className="text-foreground-secondary text-center">
          {error.message || "Failed to load recipes"}
        </Text>
        <Pressable
          onPress={handleRetry}
          className="bg-primary rounded-lg px-6 py-3 active:opacity-80"
        >
          <Text className="text-white font-semibold">Try Again</Text>
        </Pressable>
      </View>
    );
  }

  // Empty state component for MasonryGrid
  const EmptyComponent = (
    <View className="flex-1 items-center justify-center p-6 gap-4">
      <Plus size={64} color="#334d43" weight="duotone" />
      <Text className="text-xl font-playfair-bold text-foreground-heading text-center">
        No recipes yet!
      </Text>
      <Text className="text-foreground-secondary text-center">
        Tap the + button below to create your first recipe
      </Text>
    </View>
  );

  return (
    <View className="flex-1 bg-surface" style={{ paddingTop: insets.top }}>
      {/* Animated Header with Search Button */}
      <Animated.View
        className="bg-transparent "
        style={{
          transform: [{ translateY: headerTranslateY }],
          paddingHorizontal: 16,
          paddingVertical: 12,
        }}
      >
        <SearchButton
          onPress={handleSearchPress}
          placeholder={t("search.placeholder", "Search recipes...")}
        />
      </Animated.View>

      {/* Recipe Grid */}
      <MasonryGrid
        recipes={allRecipes}
        refreshing={isRefetching}
        onRefresh={handleRefresh}
        onEndReached={handleEndReached}
        onScroll={handleScroll}
        showLoadingFooter={isFetchingNextPage}
        ListEmptyComponent={EmptyComponent}
      />

      {/* FAB for adding recipes */}
      <FAB onPress={handleFABPress} />

      {/* Bottom sheet for extraction method selection */}
      <ExtractionMethodBottomSheet
        ref={bottomSheetRef}
        methods={methodsWithIcons}
        title={t("extraction.addRecipeFromImage")}
        onSelectMethod={handleMethodSelect}
        onConfirm={handleConfirmImages}
        onAddMore={handleAddMore}
        renderConfirmation={(props) => (
          <ImageConfirmationView
            images={props.items}
            uploadStates={props.uploadStates}
            maxItems={IMAGE_EXTRACTION_CONFIG.maxItems}
            onRemoveImage={props.onRemove}
            onAddMore={props.onAddMore}
            onConfirm={props.onConfirm}
            onBack={props.onBack}
            isUploading={props.isUploading}
          />
        )}
      />
    </View>
  );
}
