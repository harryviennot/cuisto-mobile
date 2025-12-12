import "@/global.css";
import { View, Text, Pressable } from "react-native";
import { useRef, useCallback, useEffect } from "react";
import { BottomSheetModal, BottomSheetView, BottomSheetBackdrop } from "@gorhom/bottom-sheet";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface ActionSheetProps {
  visible: boolean;
  actions: {
    label: string;
    description?: string;
    variant?: "default" | "destructive";
    icon?: React.ReactNode;
    onPress: () => void;
  }[];
  onClose: () => void;
}

export function ActionSheet({ visible, actions, onClose }: ActionSheetProps) {
  const bottomSheetModalRef = useRef<BottomSheetModal>(null);

  const { bottom } = useSafeAreaInsets();

  useEffect(() => {
    if (visible) {
      bottomSheetModalRef.current?.present();
    } else {
      bottomSheetModalRef.current?.dismiss();
    }
  }, [visible]);

  const renderBackdrop = useCallback(
    (props: React.ComponentProps<typeof BottomSheetBackdrop>) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
        opacity={0.5}
        pressBehavior="close"
      />
    ),
    []
  );

  const handleClose = () => {
    onClose();
  };

  useEffect(() => {
    if (visible) {
      bottomSheetModalRef.current?.present();
    } else {
      bottomSheetModalRef.current?.dismiss();
    }
  }, [visible]);

  return (
    <BottomSheetModal
      ref={bottomSheetModalRef}
      enableDynamicSizing
      enablePanDownToClose
      onDismiss={handleClose}
      backdropComponent={renderBackdrop}
      backgroundStyle={{ backgroundColor: "#FEFCF8" }}
      handleIndicatorStyle={{ backgroundColor: "#334d43", width: 40 }}
    >
      <BottomSheetView
        className="flex-1 bg-surface-elevated px-4 pt-4"
        style={{ paddingBottom: bottom + 16 }}
      >
        <View className="gap-4">
          {actions.filter(Boolean).map((action) => (
            <Pressable
              key={action.label}
              onPress={() => {
                action.onPress();
              }}
              className={`flex-row items-center gap-4 rounded-2xl border-2 p-4 active:bg-surface ${action.variant === "destructive"
                ? "border-state-error/50 bg-state-error/15"
                : "border-border bg-surface-elevated"
                }`}
            >
              <View
                className={`h-12 w-12 items-center justify-center rounded-xl ${action.variant === "destructive" ? "bg-state-error/15" : "bg-primary/10"
                  }`}
              >
                {action.icon}
              </View>
              <View className="flex-1 justify-center">
                <Text className="text-lg font-medium text-foreground-heading">{action.label}</Text>
                {action.description && (
                  <Text
                    className={`text-sm mt-0.5 ${action.variant === "destructive"
                      ? "text-state-error"
                      : "text-foreground-muted"
                      }`}
                  >
                    {action.description}
                  </Text>
                )}
              </View>
            </Pressable>
          ))}
        </View>
      </BottomSheetView>
    </BottomSheetModal>
  );
}
