/**
 * Cooking History Screen
 *
 * Full-page view of the user's cooking history with:
 * - Grid/List view toggle
 * - Masonry grid layout or list view
 * - Sticky header with back button
 * - Pull-to-refresh and infinite scroll
 * - Empty state
 */
import React, { useMemo, useCallback, useRef, useState } from "react";
import { View, RefreshControl, SectionList, Alert } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import Animated, {
  FadeIn,
  useSharedValue,
  useAnimatedScrollHandler,
  useDerivedValue,
} from "react-native-reanimated";
import { useTranslation } from "react-i18next";

import {
  useCookingHistoryInfinite,
  useUpdateCookingEvent,
  useDeleteCookingEvent,
} from "@/hooks/useCookingHistory";
import type { CookingHistoryEvent, UpdateCookingEventParams } from "@/types/cookingHistory";
import { UnifiedStickyHeader } from "@/components/ui/UnifiedStickyHeader";
import { PageHeader } from "@/components/ui/PageHeader";
import {
  CookingHistoryListItem,
  CookingHistoryListItemSkeleton,
  CookingHistoryEmpty,
  CookingHistoryMonthHeader,
  groupEventsToSections,
  CookingHistorySection,
  type CookingHistoryListItemHandle,
} from "@/components/library/cooking-history";
import { EditCookingEventBottomSheet } from "@/components/library/cooking-history/EditCookingEventBottomSheet";
import type { SwipeableMethods } from "react-native-gesture-handler/ReanimatedSwipeable";
import { ErrorState } from "@/components/ui/ErrorState";

const AnimatedSectionList = Animated.createAnimatedComponent(SectionList);

export default function CookingHistoryScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  // Ref to track the currently open swipeable item (for closing others)
  const openSwipeableRef = useRef<SwipeableMethods | null>(null);

  // Refs to list items for delete animation (keyed by event_id)
  const itemRefsMap = useRef<Map<string, CookingHistoryListItemHandle>>(new Map());

  // State for edit modal
  const [selectedEvent, setSelectedEvent] = useState<CookingHistoryEvent | null>(null);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);

  // Mutations
  const updateEventMutation = useUpdateCookingEvent();
  const deleteEventMutation = useDeleteCookingEvent();

  // Fetch cooking history with infinite scroll
  const {
    data,
    isLoading,
    error,
    refetch,
    isRefetching,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useCookingHistoryInfinite();

  // Group pages for display
  const sections = useMemo(() => {
    const flatEvents = data?.pages.flatMap((page) => page) ?? [];
    return groupEventsToSections(flatEvents);
  }, [data]);

  // 52 is roughly the height of UnifiedStickyHeader content (40px button + 12px paddingBottom)
  const headerTopPadding = insets.top + 60;

  // Scroll handling for sticky header
  // Initialize to -headerTopPadding to match contentOffset initial position
  const scrollY = useSharedValue(-headerTopPadding);
  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
    },
  });

  const handleBack = () => router.back();

  const handleRefresh = useCallback(async () => {
    await refetch();
  }, [refetch]);

  const handleEndReached = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  // Edit handler - open the edit modal
  const handleEdit = useCallback((event: CookingHistoryEvent) => {
    setSelectedEvent(event);
    setIsEditModalVisible(true);
  }, []);

  // Delete handler - show confirmation alert, then animate and delete
  const handleDelete = useCallback(
    (event: CookingHistoryEvent) => {
      Alert.alert(
        t("cookingHistory.deleteConfirmTitle"),
        t("cookingHistory.deleteConfirmMessage"),
        [
          { text: t("common.cancel"), style: "cancel" },
          {
            text: t("common.delete"),
            style: "destructive",
            onPress: () => {
              // Get the item ref and animate, then delete
              const itemRef = itemRefsMap.current.get(event.event_id);
              if (itemRef) {
                itemRef.animateDelete(() => {
                  deleteEventMutation.mutate({
                    eventId: event.event_id,
                    recipeId: event.recipe_id,
                  });
                });
              } else {
                // Fallback: delete without animation
                deleteEventMutation.mutate({
                  eventId: event.event_id,
                  recipeId: event.recipe_id,
                });
              }
            },
          },
        ]
      );
    },
    [deleteEventMutation, t]
  );

  // Save edit handler
  const handleSaveEdit = useCallback(
    (params: UpdateCookingEventParams) => {
      if (!selectedEvent) return;
      updateEventMutation.mutate(
        { eventId: selectedEvent.event_id, params },
        {
          onSuccess: () => {
            setIsEditModalVisible(false);
            setSelectedEvent(null);
          },
        }
      );
    },
    [selectedEvent, updateEventMutation]
  );

  // Close edit modal
  const handleCloseEdit = useCallback(() => {
    setIsEditModalVisible(false);
    setSelectedEvent(null);
  }, []);

  // Adjust scrollY for the header animation because contentInset shifts the origin
  const adjustedScrollY = useDerivedValue(() => {
    return scrollY.value + headerTopPadding;
  });

  // Header component
  const ListHeaderComponent = useMemo(
    () => (
      <View>
        <PageHeader
          subtitle={t("cookingHistory.subtitle") || "RECENTLY COOKED"}
          title={t("cookingHistory.title")}
          topPadding={0} // Content handled by contentInset
        />
      </View>
    ),
    [t]
  );

  // Stable ref callback to avoid creating new functions per render
  const setItemRef = useCallback((eventId: string, ref: CookingHistoryListItemHandle | null) => {
    if (ref) {
      itemRefsMap.current.set(eventId, ref);
    } else {
      itemRefsMap.current.delete(eventId);
    }
  }, []);

  // Render list item
  const renderItem = useCallback(
    ({ item }: { item: unknown }) => {
      const event = item as CookingHistoryEvent;
      return (
        <CookingHistoryListItem
          ref={(ref) => setItemRef(event.event_id, ref)}
          event={event}
          openSwipeableRef={openSwipeableRef}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      );
    },
    [handleEdit, handleDelete, setItemRef]
  );

  // Render section header
  const renderSectionHeader = useCallback(
    ({ section }: { section: unknown }) => (
      <CookingHistoryMonthHeader label={(section as CookingHistorySection).title} />
    ),
    []
  );

  // Loading skeleton for list view
  const ListLoadingSkeleton = () => (
    <View style={{ paddingTop: headerTopPadding }}>
      {[1, 2, 3, 4, 5].map((i) => (
        <CookingHistoryListItemSkeleton key={i} />
      ))}
    </View>
  );

  return (
    <View className="flex-1 bg-surface">
      <Animated.View entering={FadeIn.duration(300)} className="flex-1">
        {isLoading ? (
          <ListLoadingSkeleton />
        ) : error ? (
          <ErrorState title="Error" message={error.message} onRetry={handleRefresh} />
        ) : sections.length === 0 ? (
          <View style={{ paddingTop: headerTopPadding }}>
            <CookingHistoryEmpty variant="full" />
          </View>
        ) : (
          <AnimatedSectionList
            sections={sections}
            keyExtractor={(item: any) => item.event_id}
            renderItem={renderItem}
            renderSectionHeader={renderSectionHeader}
            ListHeaderComponent={ListHeaderComponent}
            stickySectionHeadersEnabled={true}
            onScroll={scrollHandler}
            scrollEventThrottle={16}
            onEndReached={handleEndReached}
            onEndReachedThreshold={0.5}
            // Performance optimizations
            removeClippedSubviews={true}
            maxToRenderPerBatch={10}
            windowSize={5}
            initialNumToRender={10}
            updateCellsBatchingPeriod={50}
            // Use contentInset to handle sticky header offset below navbar
            contentInset={{ top: headerTopPadding }}
            contentOffset={{ x: 0, y: -headerTopPadding }}
            scrollIndicatorInsets={{ top: headerTopPadding }}
            refreshControl={
              <RefreshControl
                refreshing={isRefetching}
                onRefresh={handleRefresh}
                tintColor="#334d43"
                progressViewOffset={headerTopPadding}
              />
            }
            contentContainerStyle={{ paddingBottom: 100 }}
          />
        )}
      </Animated.View>

      <UnifiedStickyHeader
        title={t("cookingHistory.title")}
        scrollY={adjustedScrollY}
        onBackPress={handleBack}
      />

      {/* Edit Modal */}
      <EditCookingEventBottomSheet
        visible={isEditModalVisible}
        event={selectedEvent}
        onSave={handleSaveEdit}
        onClose={handleCloseEdit}
        isSaving={updateEventMutation.isPending}
      />
    </View>
  );
}
