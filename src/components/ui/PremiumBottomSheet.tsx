import React, { useCallback, useMemo, forwardRef } from "react";
import { View, Text, ViewStyle, StyleProp, Pressable } from "react-native";
import {
  BottomSheetModal,
  BottomSheetBackdrop,
  BottomSheetBackdropProps,
  BottomSheetView,
  BottomSheetModalProps,
} from "@gorhom/bottom-sheet";
import { BlurView } from "expo-blur";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { X } from "phosphor-react-native";

interface PremiumBottomSheetProps extends Omit<BottomSheetModalProps, "snapPoints" | "children"> {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  snapPoints?: (string | number)[];
  contentStyle?: StyleProp<ViewStyle>;
  onClose?: () => void;
  keyboardBehavior?: "extend" | "fillParent" | "interactive";
  keyboardBlurBehavior?: "none" | "restore";
  android_keyboardInputMode?: "adjustPan" | "adjustResize";
}

export const PremiumBottomSheet = forwardRef<BottomSheetModal, PremiumBottomSheetProps>(
  ({
    children,
    title,
    subtitle,
    snapPoints,
    contentStyle,
    onClose,
    keyboardBehavior = "interactive",
    keyboardBlurBehavior = "restore",
    android_keyboardInputMode = "adjustResize",
    ...props
  }, ref) => {
    const insets = useSafeAreaInsets();

    const finalSnapPoints = snapPoints ? snapPoints : [];

    const renderBackdrop = useCallback(
      (props: BottomSheetBackdropProps) => (
        <BottomSheetBackdrop
          {...props}
          disappearsOnIndex={-1}
          appearsOnIndex={0}
          opacity={0.4}
          pressBehavior="close"
        />
      ),
      []
    );

    return (
      <BottomSheetModal
        ref={ref}
        snapPoints={finalSnapPoints}
        enablePanDownToClose={true}
        enableDynamicSizing={!snapPoints}
        backdropComponent={renderBackdrop}
        handleComponent={null}
        keyboardBehavior={keyboardBehavior}
        keyboardBlurBehavior={keyboardBlurBehavior}
        android_keyboardInputMode={android_keyboardInputMode}
        backgroundStyle={{
          backgroundColor: "#f4f1e8",
          borderTopLeftRadius: 32,
          borderTopRightRadius: 32,
        }}
        style={{
          zIndex: 50,
        }}
        {...props}
      >
        <BottomSheetView
          style={[
            { paddingBottom: insets.bottom + 20, borderRadius: 32 },
            contentStyle
          ]}
        >
          {/* Header matching DrawerHeader.tsx */}
          {(title || onClose) && (
            <View className="px-6 py-6" style={{ zIndex: 10 }}>
              <View className="flex-row items-center justify-between">
                <View className="flex-1">
                  {title && (
                    <Text
                      className="font-playfair-bold text-3xl tracking-tight text-stone-900"
                      style={{ fontFamily: 'PlayfairDisplay_700Bold' }}
                    >
                      {title}
                    </Text>
                  )}
                  {subtitle && (
                    <Text className="mt-1.5 text-[10px] font-bold uppercase tracking-widest text-stone-500">
                      {subtitle}
                    </Text>
                  )}
                </View>
                {onClose && (
                  <Pressable
                    onPress={onClose}
                    className="active:scale-90"
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <X size={24} color="#57534e" weight="bold" />
                  </Pressable>
                )}
              </View>
            </View>
          )}

          {children}
        </BottomSheetView>
      </BottomSheetModal >
    );
  }
);

PremiumBottomSheet.displayName = "PremiumBottomSheet";
