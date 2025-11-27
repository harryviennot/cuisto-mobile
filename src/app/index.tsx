import { useTranslation } from "react-i18next";
import { View, Text, ActivityIndicator, Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRef, useCallback } from "react";
import { CameraIcon, ImageIcon, PlusIcon, WarningIcon } from "phosphor-react-native";
import { useQueryClient } from "@tanstack/react-query";
import { router } from "expo-router";
import { BlurView } from "expo-blur";
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
import { SearchButton } from "@/components/home/SearchButton";
import { MasonryGrid } from "@/components/home/MasonryGrid";
import { useRecipes } from "@/hooks/useRecipes";

export default function Index() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const bottomSheetRef = useRef<ExtractionMethodBottomSheetRef>(null);

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
      } catch {
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
        <CameraIcon size={32} color="#334d43" weight="duotone" />
      ) : (
        <ImageIcon size={32} color="#334d43" weight="duotone" />
      ),
  }));

  // All recipes - deduplicate by ID to handle any backend duplicates
  const allRecipes = data?.pages.flatMap((page) => page) ?? [];
  const uniqueRecipes = Array.from(
    new Map(allRecipes.map((recipe) => [recipe.id, recipe])).values()
  );

  // Handle infinite scroll
  const handleEndReached = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

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
        <WarningIcon size={64} color="#ef4444" weight="duotone" />
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
      <PlusIcon size={64} color="#334d43" weight="duotone" />
      <Text className="text-xl font-playfair-bold text-foreground-heading text-center">
        No recipes yet!
      </Text>
      <Text className="text-foreground-secondary text-center">
        Tap the + button below to create your first recipe
      </Text>
    </View>
  );

  return (
    <View className="flex-1 bg-surface">
      {/* Recipe Grid with Sticky Header */}
      <MasonryGrid
        recipes={uniqueRecipes}
        refreshing={isRefetching}
        onRefresh={handleRefresh}
        onEndReached={handleEndReached}
        showLoadingFooter={isFetchingNextPage}
        ListEmptyComponent={EmptyComponent}
        contentContainerStyle={{
          paddingTop: insets.top, // Push content down so it starts below safe area
          paddingBottom: 100,
        }}
        stickyHeaderIndices={[0]}
        stickyHeaderHiddenOnScroll={true}
        refreshControlOffset={insets.top}
        ListHeaderComponent={
          <BlurView
            intensity={50}
            tint="light"
            style={{
              paddingTop: insets.top, // Extend blur upward to cover safe area
              marginTop: -insets.top, // Pull it up to start at the very top
              paddingHorizontal: 16,
              paddingBottom: 16,
            }}
          >
            <Text
              className="text-5xl font-playfair-bold leading-tight text-foreground-heading mb-4"
              style={{
                fontFamily: "PlayfairDisplay_500Medium",
                textShadowColor: "rgba(0, 0, 0, 0.03)",
                textShadowOffset: { width: 1, height: 1 },
                textShadowRadius: 1,
              }}
            >
              My Recipes
            </Text>
            <SearchButton
              onPress={handleSearchPress}
              placeholder={t("search.placeholder", "Search recipes...")}
            />
          </BlurView>
        }
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
          zIndex: 10, // Ensure it's above the refresh control
        }}
        pointerEvents="box-none" // Allow touches through but keep blur visible
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
