/**
 * Bottom sheet for selecting extraction method and confirming content
 * Generic component that supports multiple extraction types (image, video, URL, etc.)
 */
import React, { forwardRef, useCallback, useImperativeHandle, useState } from "react";
import { View, Text, Pressable, ActionSheetIOS, Platform, Alert } from "react-native";
import { BottomSheetModal, BottomSheetBackdrop, BottomSheetView } from "@gorhom/bottom-sheet";
import type { BottomSheetBackdropProps } from "@gorhom/bottom-sheet";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import type { ExtractionMethodConfig, ExtractionSourceType } from "@/config/extractionMethods";

export interface ExtractionMethodBottomSheetRef<T = any> {
  present: () => void;
  dismiss: () => void;
  showConfirmation: (items: T[]) => void;
}

interface ExtractionMethodBottomSheetProps<T = any> {
  methods: ExtractionMethodConfig[];
  title?: string;
  onSelectMethod: (method: ExtractionSourceType) => void;
  onConfirm: (items: T[]) => void;
  onAddMore?: (method: ExtractionSourceType) => Promise<T[] | null>;
  renderConfirmation?: (props: ConfirmationRenderProps<T>) => React.ReactNode;
}

export interface ConfirmationRenderProps<T> {
  items: T[];
  uploadStates: Record<number, "uploading" | "completed" | "error">;
  onRemove: (index: number) => void;
  onAddMore: () => void;
  onConfirm: () => void;
  onBack: () => void;
  isUploading: boolean;
}

export const ExtractionMethodBottomSheet = forwardRef<
  ExtractionMethodBottomSheetRef,
  ExtractionMethodBottomSheetProps
>(({ methods, title, onSelectMethod, onConfirm, onAddMore, renderConfirmation }, ref) => {
  const { t } = useTranslation();
  const bottomSheetRef = React.useRef<BottomSheetModal>(null);
  const [view, setView] = useState<"method" | "confirmation">("method");
  const [selectedItems, setSelectedItems] = useState<any[]>([]);
  const [uploadingStates, setUploadingStates] = useState<
    Record<number, "uploading" | "completed" | "error">
  >({});

  const { bottom } = useSafeAreaInsets();

  // Use translated title if not provided
  const displayTitle = title || t("extraction.addRecipe");

  // Expose methods to parent via ref
  useImperativeHandle(ref, () => ({
    present: () => {
      setView("method");
      setSelectedItems([]);
      setUploadingStates({});
      bottomSheetRef.current?.present();
    },
    dismiss: () => {
      bottomSheetRef.current?.dismiss();
    },
    showConfirmation: (items: any[]) => {
      setSelectedItems(items);
      setView("confirmation");
      setUploadingStates({});
    },
  }));

  const renderBackdrop = useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop {...props} appearsOnIndex={0} disappearsOnIndex={-1} opacity={0.5} />
    ),
    []
  );

  const handleSheetChanges = useCallback((index: number) => {
    if (index === -1) {
      // Reset when dismissed
      setView("method");
      setSelectedItems([]);
      setUploadingStates({});
    }
  }, []);

  const handleRemoveItem = (index: number) => {
    setSelectedItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleConfirmInternal = () => {
    if (selectedItems.length === 0) return;

    // Set all items to uploading state
    const initialStates: Record<number, "uploading"> = {};
    selectedItems.forEach((_, index) => {
      initialStates[index] = "uploading";
    });
    setUploadingStates(initialStates);

    // Call parent callback to handle upload
    onConfirm(selectedItems);
  };

  const handleBackToMethod = () => {
    setView("method");
    setSelectedItems([]);
    setUploadingStates({});
  };

  const handleAddMoreInternal = () => {
    if (isUploading || !onAddMore) return;

    // Determine which methods support adding more
    const addMoreMethods = methods.filter((m) => m.id === "camera" || m.id === "gallery");

    if (addMoreMethods.length === 0) return;

    // Show native action sheet
    if (Platform.OS === "ios") {
      const options = [t("common.cancel"), ...addMoreMethods.map((m) => m.label)];
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options,
          cancelButtonIndex: 0,
        },
        async (buttonIndex) => {
          if (buttonIndex > 0 && onAddMore) {
            const selectedMethod = addMoreMethods[buttonIndex - 1];
            const newItems = await onAddMore(selectedMethod.id);
            if (newItems && newItems.length > 0) {
              setSelectedItems((prev) => [...prev, ...newItems]);
            }
          }
        }
      );
    } else {
      // Android - show alert dialog
      Alert.alert(
        t("extraction.addMore"),
        t("extraction.chooseOption"),
        [
          { text: t("common.cancel"), style: "cancel" },
          ...addMoreMethods.map((method) => ({
            text: method.label,
            onPress: async () => {
              if (onAddMore) {
                const newItems = await onAddMore(method.id);
                if (newItems && newItems.length > 0) {
                  setSelectedItems((prev) => [...prev, ...newItems]);
                }
              }
            },
          })),
        ],
        { cancelable: true }
      );
    }
  };

  const isUploading = Object.keys(uploadingStates).length > 0;

  return (
    <BottomSheetModal
      ref={bottomSheetRef}
      enableDynamicSizing
      enablePanDownToClose={!isUploading}
      enableHandlePanningGesture={!isUploading}
      backdropComponent={renderBackdrop}
      onChange={handleSheetChanges}
      backgroundStyle={{ backgroundColor: "#fefdfb" }}
      handleIndicatorStyle={{ backgroundColor: "#334d43", width: 40 }}
      keyboardBehavior="interactive"
      keyboardBlurBehavior="restore"
      android_keyboardInputMode="adjustResize"
    >
      {view === "method" ? (
        /* METHOD SELECTION VIEW */
        <BottomSheetView
          className="flex-1 bg-surface-elevated px-6 pt-4"
          style={{ paddingBottom: bottom + 16 }}
        >
          <Text className="mb-6 text-center text-xl font-semibold text-foreground-heading">
            {displayTitle}
          </Text>

          <View className="gap-4">
            {methods.map((method) => (
              <Pressable
                key={method.id}
                onPress={() => {
                  onSelectMethod(method.id);
                }}
                className="flex-row items-center gap-4 rounded-2xl border-2 border-border bg-surface-elevated p-6 active:bg-surface"
              >
                <View className="h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                  {method.icon}
                </View>
                <Text className="flex-1 text-lg font-medium text-foreground-heading">
                  {method.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </BottomSheetView>
      ) : (
        /* CONFIRMATION VIEW */
        <BottomSheetView style={{ paddingBottom: bottom }}>
          {renderConfirmation?.({
            items: selectedItems,
            uploadStates: uploadingStates,
            onRemove: handleRemoveItem,
            onAddMore: handleAddMoreInternal,
            onConfirm: handleConfirmInternal,
            onBack: handleBackToMethod,
            isUploading,
          })}
        </BottomSheetView>
      )}
    </BottomSheetModal>
  );
});

ExtractionMethodBottomSheet.displayName = "ExtractionMethodBottomSheet";
